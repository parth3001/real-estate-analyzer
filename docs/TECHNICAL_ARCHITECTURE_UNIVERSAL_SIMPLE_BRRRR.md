# Technical Architecture: Universal Simple + BRRRR Strategy Support

**Date**: December 10, 2025
**Author**: Principal Architect Analysis
**Purpose**: Technical implementation plan for Phase 1 (Universal Simple) and Phase 2 (BRRRR Support)

---

## Executive Summary

### Core Architectural Principle: Progressive Disclosure
- **Hide complexity, not capability** - Advanced fields hidden by default, but accessible
- **Novice-first UX** - Simple path for 80% of users, power user options for 20%
- **No inline editing in results** - Results are static, adjustments made in wizard
- **Strategy-aware presentation** - Same backend calculations, different frontend views

### Implementation Phases
- **Phase 1**: Universal Simple (2 weeks, frontend-only)
- **Phase 2**: BRRRR-Specific Features (2-3 weeks, backend + frontend)

### Backend Strategy
- **Phase 1**: Zero backend changes (same Investment Decision Engine)
- **Phase 2**: New BRRRR calculation service (wrapper around existing SFRAnalyzer)

---

## Josh Lupo Feedback Analysis (Combined A + B + C)

### Problem A: Too Many Fields (Cognitive Overload)
**Josh's Pain**: "Step 4 was too much - inflation, projection periods, etc."

**Root Cause**: Novice users don't understand advanced concepts like inflation, appreciation rates

**Solution**: Progressive disclosure
- Advanced fields hidden in expandable sections
- Smart defaults pre-filled automatically
- User can expand if they want control

---

### Problem B: Slider Limitations (Precision Input)
**Josh's Pain**: "Couldn't input exact value I wanted - needed $2,000 more than estimate"

**Root Cause**: Sliders force stepped values, can't input exact amounts

**Solution**: Hybrid slider + text input
```
Rental Income
RentCast Estimate: $1,800/mo

Your Estimate:
[Slider: ----●--------] [$3,800]
         $1,000        $5,000

(User can drag slider OR type exact $3,800)
```

---

### Problem C: Abstract vs Concrete Values
**Josh's Pain**: "Property tax and insurance should be visible (basic costs), but appreciation rates are for pros"

**Root Cause**: Mixing concrete dollars with abstract percentages creates confusion

**Solution**: Visibility hierarchy
- **Always Visible**: Dollar amounts (property tax, insurance, rent)
- **Hidden by Default**: Percentages/rates (appreciation, inflation, cap rate formulas)

---

## Phase 1: Universal Simple - Technical Specification

### Goal
Simplified wizard with progressive disclosure - works for ALL investment strategies (Buy & Hold, BRRRR, House Hacking)

### Success Criteria
- ✅ Time-to-first-analysis: <5 minutes (from current ~12 minutes)
- ✅ Required fields reduced: 8 fields (from current ~25 fields)
- ✅ Advanced fields accessible but hidden (progressive disclosure)
- ✅ Josh approval: "This is simple enough for my students"

### Timeline
**2 weeks** (frontend-only changes)

---

## Phase 1: Wizard Flow Redesign

### Current Flow (5 Steps, ~25 Required Fields)
```
Step 1: Property Address (5 fields)
Step 2: Purchase & Financing (8 fields)
Step 3: Rental Analysis (6 fields)
Step 4: Long-term Assumptions (6 fields) ← JOSH HATED THIS
Step 5: Investment Goals & Strategy (3 fields)

Total: 5 steps, ~25 fields, ~12 minutes
```

### New Flow (4 Steps, 8 Required Fields + Progressive Disclosure)
```
Step 0: Investment Goals & Strategy (2 required fields)
  Required:
  - Primary Goal (Cash Flow, Wealth Building, etc.)
  - Investment Strategy (Buy & Hold, BRRRR, House Hacking) ← Phase 2 uses this

Step 1: Property Address (3 required fields)
  Required:
  - Street Address
  - City, State, ZIP
  - Property Type (SFR, Condo, Townhouse)

  Auto-filled from RentCast:
  - Bedrooms, Bathrooms, Square Footage

Step 2: Purchase & Financing (2 required fields)
  Required:
  - Purchase Price
  - Down Payment %

  Auto-filled (adjustable via progressive disclosure):
  - Interest Rate (from FRED API)
  - Loan Term (30 years default)
  - Closing Costs (3% default)
  - Property Tax ($X/year from ZIP code data) [Customize ▼]
  - Insurance ($X/year area average) [Customize ▼]

  [Advanced Financing Options] ← Expandable (collapsed by default)
  - PMI Rate (if down payment < 20%)
  - HOA Fees
  - Other Monthly Costs

Step 3: Rental & Operating Expenses (1 required field)
  Required:
  - Rental Income (pre-filled from RentCast, adjustable)

  Auto-filled (adjustable via progressive disclosure):
  - Vacancy Rate (5% default)
  - Property Management (8% default)
  - Maintenance (1% of property value default)
  - Other Expenses ($0 default)

  [Advanced Assumptions] ← Expandable (collapsed by default)
  - Annual Appreciation Rate (3% default)
  - Annual Rent Growth (2.5% default)
  - Inflation Rate (2.5% default)
  - Projection Period (30 years default)

Total: 4 steps, 8 required fields, <5 minutes
```

---

## Phase 1: Progressive Disclosure UX Patterns

### Pattern 1: Inline Expandable Fields (Concrete Values)

**Use Case**: Property Tax, Insurance (concrete dollar amounts)

**UI Pattern**:
```tsx
<Box sx={{ mb: 2 }}>
  {/* Collapsed State (Default) */}
  <Box sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    p: 2,
    backgroundColor: 'gray.50',
    borderRadius: '8px'
  }}>
    <Box>
      <Typography variant="body2" color="text.secondary">
        Property Tax (estimated)
      </Typography>
      <Typography variant="h6">
        $3,600/year
      </Typography>
      <Typography variant="caption" color="text.secondary">
        1.2% based on ZIP code
      </Typography>
    </Box>
    <Button
      size="small"
      endIcon={<ExpandMoreIcon />}
      onClick={() => setExpanded(!expanded)}
    >
      Customize
    </Button>
  </Box>

  {/* Expanded State (When User Clicks "Customize") */}
  {expanded && (
    <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
      <TextField
        label="Property Tax Rate"
        type="number"
        value={propertyTaxRate}
        onChange={(e) => setPropertyTaxRate(e.target.value)}
        InputProps={{
          endAdornment: <InputAdornment position="end">%</InputAdornment>
        }}
        helperText="Typical range: 0.5% - 3.0%"
        fullWidth
      />

      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        Annual Tax: ${(purchasePrice * propertyTaxRate / 100).toFixed(0)}
      </Typography>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button size="small" onClick={() => resetToDefault()}>
          Reset to Default
        </Button>
        <Button size="small" variant="contained" onClick={() => setExpanded(false)}>
          Save
        </Button>
      </Box>
    </Box>
  )}
</Box>
```

**Fields Using This Pattern**:
- Property Tax
- Insurance
- Rental Income (RentCast estimate)

---

### Pattern 2: Expandable Section (Advanced Assumptions)

**Use Case**: Appreciation, inflation, projection period (abstract concepts)

**UI Pattern**:
```tsx
<Accordion
  sx={{ mt: 3 }}
  defaultExpanded={false}
>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <SettingsIcon fontSize="small" color="action" />
      <Typography variant="body2">
        Advanced Assumptions
      </Typography>
      <Chip
        label="Optional"
        size="small"
        color="default"
        sx={{ ml: 1 }}
      />
    </Box>
  </AccordionSummary>

  <AccordionDetails>
    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
      These values are pre-filled with smart defaults based on market data.
      Adjust only if you have specific knowledge about this property or market.
    </Typography>

    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Annual Property Appreciation"
          type="number"
          value={appreciationRate}
          onChange={(e) => setAppreciationRate(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">%/year</InputAdornment>
          }}
          helperText="Default: 3.0% (historical average)"
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Annual Rent Growth"
          type="number"
          value={rentGrowthRate}
          onChange={(e) => setRentGrowthRate(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">%/year</InputAdornment>
          }}
          helperText="Default: 2.5% (inflation-adjusted)"
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Inflation Rate"
          type="number"
          value={inflationRate}
          onChange={(e) => setInflationRate(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">%/year</InputAdornment>
          }}
          helperText="Default: 2.5% (Fed target)"
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Analysis Period"
          type="number"
          value={projectionPeriod}
          onChange={(e) => setProjectionPeriod(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">years</InputAdornment>
          }}
          helperText="Default: 30 years (mortgage term)"
          fullWidth
        />
      </Grid>
    </Grid>

    <Button
      size="small"
      sx={{ mt: 2 }}
      onClick={() => resetAllToDefaults()}
    >
      Reset All to Defaults
    </Button>
  </AccordionDetails>
</Accordion>
```

**Fields Using This Pattern**:
- Annual Property Appreciation Rate
- Annual Rent Growth Rate
- Inflation Rate
- Projection Period

---

### Pattern 3: Hybrid Slider + Text Input (Rental Income)

**Use Case**: User wants visual feedback (slider) but also precise input (text)

**UI Pattern**:
```tsx
<Box sx={{ mb: 3 }}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Estimated Monthly Rent
  </Typography>

  {/* RentCast Estimate Badge */}
  <Chip
    label={`RentCast Estimate: $${rentcastEstimate}/mo`}
    color="info"
    size="small"
    sx={{ mb: 2 }}
  />

  {/* Hybrid Slider + Text Input */}
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
    {/* Slider (Visual Feedback) */}
    <Slider
      value={rentalIncome}
      onChange={(_, value) => setRentalIncome(value as number)}
      min={Math.floor(rentcastEstimate * 0.5)}
      max={Math.ceil(rentcastEstimate * 1.5)}
      step={50}
      marks={[
        { value: Math.floor(rentcastEstimate * 0.5), label: '-50%' },
        { value: rentcastEstimate, label: 'RentCast' },
        { value: Math.ceil(rentcastEstimate * 1.5), label: '+50%' }
      ]}
      sx={{ flex: 1 }}
    />

    {/* Text Input (Precise Control) */}
    <TextField
      type="number"
      value={rentalIncome}
      onChange={(e) => setRentalIncome(Number(e.target.value))}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        endAdornment: <InputAdornment position="end">/mo</InputAdornment>
      }}
      sx={{ width: 150 }}
    />
  </Box>

  {/* Difference from RentCast */}
  {rentalIncome !== rentcastEstimate && (
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
      {rentalIncome > rentcastEstimate ? '+' : ''}
      ${rentalIncome - rentcastEstimate}/mo
      ({((rentalIncome - rentcastEstimate) / rentcastEstimate * 100).toFixed(1)}%)
      vs RentCast estimate
    </Typography>
  )}
</Box>
```

**Fields Using This Pattern**:
- Rental Income
- Down Payment % (maybe)

---

## Phase 1: Results Display - Progressive Metric Disclosure

### Current Results Display (All 28 Metrics Shown)
**Problem**: Overwhelming for novices, Josh's students complained

### New Results Display (5-7 Novice Metrics + Progressive Disclosure)

**Default View (Novice Mode)**:
```tsx
<Box sx={{ mb: 4 }}>
  {/* Investment Decision Hero - Always Visible */}
  <InvestmentDecisionHero verdict="BUY" score={78} />

  {/* Novice Metrics (5-7 Core Metrics) */}
  <Grid container spacing={3} sx={{ mt: 2 }}>
    <Grid item xs={12} sm={6} md={4}>
      <MetricCard
        label="Monthly Cash Flow"
        value={formatCurrency(monthlyСashFlow)}
        trend={monthlyСashFlow > 0 ? 'positive' : 'negative'}
        helpText="Money left after all expenses each month"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <MetricCard
        label="Cash-on-Cash Return"
        value={`${cashOnCashReturn.toFixed(1)}%`}
        benchmark="6-10% typical"
        helpText="Annual return on your down payment"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <MetricCard
        label="Total Cash Needed"
        value={formatCurrency(totalCashNeeded)}
        helpText="Down payment + closing costs"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <MetricCard
        label="Monthly Mortgage"
        value={formatCurrency(monthlyMortgage)}
        helpText="Principal + Interest payment"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <MetricCard
        label="Cap Rate"
        value={`${capRate.toFixed(2)}%`}
        benchmark="5-8% typical"
        helpText="Return if you paid cash (no mortgage)"
      />
    </Grid>
  </Grid>

  {/* Progressive Disclosure Button */}
  <Box sx={{ mt: 3, textAlign: 'center' }}>
    <Button
      variant="outlined"
      endIcon={<ExpandMoreIcon />}
      onClick={() => setShowProfessionalMetrics(!showProfessionalMetrics)}
    >
      {showProfessionalMetrics
        ? 'Hide Professional Metrics'
        : 'View Professional Metrics (23 more)'}
    </Button>
  </Box>

  {/* Professional Metrics (Expandable) */}
  {showProfessionalMetrics && (
    <Box sx={{ mt: 3, p: 3, backgroundColor: 'gray.50', borderRadius: '12px' }}>
      <Typography variant="h6" gutterBottom>
        Professional Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Advanced metrics for experienced investors and institutional analysis.
      </Typography>

      <Grid container spacing={2}>
        {/* All 23 remaining metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            label="Internal Rate of Return (IRR)"
            value={`${irr.toFixed(2)}%`}
            benchmark="10-15% target"
            helpText="Time-weighted return over investment period"
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            label="Debt Service Coverage Ratio (DSCR)"
            value={dscr.toFixed(2)}
            benchmark="1.25+ for financing"
            helpText="NOI divided by mortgage payment"
            size="small"
          />
        </Grid>

        {/* ... 21 more professional metrics */}
      </Grid>
    </Box>
  )}
</Box>
```

---

### Novice vs Professional Metrics Categorization

**Novice Metrics (Always Visible - 5-7 metrics)**:
1. **Monthly Cash Flow** - Most important for beginners
2. **Cash-on-Cash Return** - Simple ROI concept
3. **Total Cash Needed** - How much money to bring
4. **Monthly Mortgage Payment** - Largest expense
5. **Cap Rate** - Industry standard metric
6. **Purchase Price** - Context
7. **Down Payment** - Context

**Professional Metrics (Hidden by Default - 23 metrics)**:
1. Internal Rate of Return (IRR)
2. Debt Service Coverage Ratio (DSCR)
3. Gross Rent Multiplier (GRM)
4. Net Operating Income (NOI)
5. Operating Expense Ratio
6. Break-Even Occupancy
7. Equity Multiple
8. Total Return (10-year)
9. Annualized Return
10. Return on Investment (ROI)
11. Return on Equity (ROE)
12. Profit if Sold Today
13. Equity (Year 1)
14. Equity (Year 10)
15. Appreciation (10-year)
16. Mortgage Paydown (10-year)
17. Total Expenses (Monthly)
18. Property Tax (Monthly)
19. Insurance (Monthly)
20. Management Fee (Monthly)
21. Maintenance (Monthly)
22. Vacancy Cost (Monthly)
23. Other Expenses (Monthly)

---

## Phase 1: Backend Architecture (No Changes)

### Investment Decision Engine - Unchanged
**File**: `/backend/src/services/investment/investmentDecisionEngine.ts`

**Current Behavior**:
- Accepts all property data inputs
- Calculates all 28 metrics
- Returns BUY/NEGOTIATE/PASS verdict with 0-100 score

**Phase 1 Impact**: ZERO CHANGES
- Frontend sends same data (smart defaults or user overrides)
- Backend doesn't know/care if values are defaults or custom
- Returns all 28 metrics (frontend decides what to show)

### Smart Defaults Service (New Optional Service)

**File**: `/backend/src/services/smartDefaults.ts`

**Purpose**: Provide location-based smart defaults

```typescript
interface SmartDefaults {
  propertyTaxRate: number;        // Based on ZIP code
  insuranceCost: number;          // Based on property value + location
  appreciationRate: number;       // Historical market data
  rentGrowthRate: number;         // CPI + local trends
  inflationRate: number;          // Current Fed target (2.5%)
  vacancyRate: number;            // Local market average
  maintenanceRate: number;        // 1% default
  managementFee: number;          // 8-10% typical
}

async function getSmartDefaults(
  zipCode: string,
  propertyValue: number
): Promise<SmartDefaults> {
  // Fetch from Census API, FRED API, or cached data
  const propertyTaxRate = await getTaxRateByZip(zipCode);
  const insuranceCost = estimateInsurance(propertyValue, zipCode);

  return {
    propertyTaxRate,
    insuranceCost,
    appreciationRate: 3.0,      // Historical average
    rentGrowthRate: 2.5,        // Inflation-adjusted
    inflationRate: 2.5,         // Fed target
    vacancyRate: 5.0,           // Industry standard
    maintenanceRate: 1.0,       // 1% of property value
    managementFee: 8.0,         // 8% typical
  };
}
```

**API Endpoint** (Optional - can be frontend-only defaults):
```typescript
// GET /api/smart-defaults?zip=75028&propertyValue=300000
router.get('/smart-defaults', async (req, res) => {
  const { zip, propertyValue } = req.query;
  const defaults = await getSmartDefaults(zip, Number(propertyValue));
  res.json(defaults);
});
```

**Alternative**: Frontend can have hardcoded defaults (3% appreciation, 2.5% inflation) without backend call

---

## Phase 1: Data Persistence Strategy

### Deal Model - Enhanced Metadata

**File**: `/backend/src/models/Deal.ts`

```typescript
interface Deal {
  userId: ObjectId;

  propertyData: {
    // All existing fields remain
    purchasePrice: number;
    propertyTaxRate: number;
    annualPropertyValueIncrease: number;
    // ... all 60+ fields
  },

  // NEW: Metadata to track defaults vs user overrides
  _metadata: {
    defaultsUsed: {
      propertyTaxRate: boolean;           // true = smart default, false = user override
      insuranceCost: boolean;
      appreciationRate: boolean;
      rentGrowthRate: boolean;
      inflationRate: boolean;
      vacancyRate: boolean;
      // ... track all smart-defaulted fields
    },

    wizardCompleted: boolean,             // Did user complete wizard or manual form?
    strategySelected: string,             // 'Buy & Hold', 'BRRRR', 'House Hacking' (Phase 2)
    advancedAssumptionsExpanded: boolean, // Did user open advanced section?
    professionalMetricsViewed: boolean,   // Did user view professional metrics?
  },

  analysis: {
    // All existing analysis results remain unchanged
    verdict: string;
    score: number;
    metrics: { /* all 28 metrics */ };
  },

  createdAt: Date;
  updatedAt: Date;
}
```

**Benefits**:
1. **Analytics**: Track how many users customize defaults vs accept them
2. **UX Improvements**: Identify which defaults users most often override
3. **Future Features**: "You changed property tax to 1.8%, update this analysis?" prompts
4. **Support**: Help users understand where values came from

---

## Phase 1: Frontend Architecture

### File Changes Summary

**New Files** (create):
```
/frontend/src/components/SFRAnalysis/
  StrategyStep.tsx              ← New Step 0: Goals & Strategy
  ExpandableField.tsx           ← Reusable progressive disclosure component
  HybridSliderInput.tsx         ← Slider + text input component
  AdvancedAssumptions.tsx       ← Advanced assumptions accordion
  NoviceMetricsView.tsx         ← Simplified metrics display
  ProfessionalMetricsView.tsx   ← All 28 metrics display
```

**Modified Files**:
```
/frontend/src/components/SFRAnalysis/
  PropertyWizard.tsx            ← Reorder steps, add Step 0, remove Step 4
  AddressStep.tsx               ← Minor cleanup
  FinancingStep.tsx             ← Add progressive disclosure fields
  RentalStep.tsx                ← Add hybrid slider for rent, expandable expenses
  AssumptionsStep.tsx           ← DELETE (merged into other steps as expandables)
  AnalysisResults.tsx           ← Add novice/professional toggle
  InvestmentDecisionHero.tsx    ← No changes (already good)
```

---

### Component: ExpandableField.tsx (Reusable Pattern)

```typescript
interface ExpandableFieldProps {
  label: string;
  value: number;
  unit: string;
  helperText: string;
  onValueChange: (value: number) => void;
  defaultValue: number;
  inputProps?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

export function ExpandableField({
  label,
  value,
  unit,
  helperText,
  onValueChange,
  defaultValue,
  inputProps
}: ExpandableFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const isCustomized = value !== defaultValue;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Collapsed State */}
      {!expanded && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          backgroundColor: isCustomized ? 'blue.50' : 'gray.50',
          borderRadius: '8px',
          border: isCustomized ? '1px solid' : 'none',
          borderColor: isCustomized ? 'blue.300' : 'transparent'
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6">
              {formatValue(value, unit)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
            {isCustomized && (
              <Chip
                label="Customized"
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <Button
            size="small"
            endIcon={<ExpandMoreIcon />}
            onClick={() => setExpanded(true)}
          >
            {isCustomized ? 'Edit' : 'Customize'}
          </Button>
        </Box>
      )}

      {/* Expanded State */}
      {expanded && (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
          <TextField
            label={label}
            type="number"
            value={value}
            onChange={(e) => onValueChange(Number(e.target.value))}
            helperText={helperText}
            fullWidth
            {...inputProps}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                onValueChange(defaultValue);
                setExpanded(false);
              }}
            >
              Reset to Default
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setExpanded(false)}
            >
              Save
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
```

---

## Phase 2: BRRRR-Specific Features - Technical Specification

### Goal
Add comprehensive BRRRR analysis capabilities with strategy-aware UI

### Timeline
**2-3 weeks** (backend + frontend changes)

---

## Phase 2: Backend Architecture

### New BRRRR Calculation Service

**File**: `/backend/src/services/investment/brrrStrategy.ts`

```typescript
interface BRRRRInputs extends PropertyData {
  // Existing PropertyData fields +
  rehabBudget: number;              // NEW: Renovation costs
  afterRepairValue: number;         // NEW: ARV (post-renovation value)
  refinanceLTV: number;             // NEW: Loan-to-value for refinance (70-75% typical)
  seasoningPeriod: number;          // NEW: Months before refinance (6-12 typical)
  refinanceClosingCosts: number;    // NEW: Costs to refinance (2-3% of loan)
}

interface BRRRRAnalysis {
  // Investment Phase
  purchasePrice: number;
  rehabBudget: number;
  acquisitionCosts: number;           // Purchase closing costs
  totalInvestment: number;            // Purchase + rehab + closing

  // Refinance Phase
  afterRepairValue: number;
  refinanceLTV: number;               // 70-75%
  refinanceLoanAmount: number;        // ARV × LTV
  refinanceClosingCosts: number;
  totalRefinanceProceeds: number;     // Loan amount - closing costs

  // Capital Recovery
  originalMortgageBalance: number;    // Payoff amount
  capitalRecovered: number;           // Refi proceeds - original mortgage
  capitalRemaining: number;           // Total investment - capital recovered
  capitalRecoveryRate: number;        // % of investment recovered

  // Returns
  monthlyСashFlow: number;            // After new mortgage payment
  effectiveCashOnCash: number;        // Annual cash flow ÷ capital remaining
  infiniteReturn: boolean;            // True if capital remaining ≤ 0

  // New Mortgage (Post-Refinance)
  newMortgageBalance: number;
  newMonthlyPayment: number;
  newInterestRate: number;
  newLoanTerm: number;
}

export class BRRRRAnalyzer {
  async analyze(inputs: BRRRRInputs): Promise<BRRRRAnalysis> {
    // Step 1: Calculate total investment
    const totalInvestment =
      inputs.purchasePrice +
      inputs.rehabBudget +
      inputs.acquisitionCosts;

    // Step 2: Calculate refinance proceeds
    const refinanceLoanAmount = inputs.afterRepairValue * (inputs.refinanceLTV / 100);
    const totalRefinanceProceeds = refinanceLoanAmount - inputs.refinanceClosingCosts;

    // Step 3: Calculate capital recovery
    const originalMortgageBalance = this.calculateMortgageBalance(
      inputs.purchasePrice,
      inputs.downPaymentPercent,
      inputs.interestRate,
      inputs.seasoningPeriod
    );

    const capitalRecovered = totalRefinanceProceeds - originalMortgageBalance;
    const capitalRemaining = totalInvestment - capitalRecovered;
    const capitalRecoveryRate = (capitalRecovered / totalInvestment) * 100;

    // Step 4: Calculate post-refinance cash flow
    const newMonthlyPayment = this.calculateMortgagePayment(
      refinanceLoanAmount,
      inputs.interestRate,
      360 // 30-year refi
    );

    const monthlyOperatingExpenses = /* calculate from inputs */;
    const monthlyСashFlow = inputs.rentalIncome - newMonthlyPayment - monthlyOperatingExpenses;

    // Step 5: Calculate returns
    const annualCashFlow = monthlyСashFlow * 12;
    const infiniteReturn = capitalRemaining <= 0;
    const effectiveCashOnCash = infiniteReturn
      ? Infinity
      : (annualCashFlow / capitalRemaining) * 100;

    return {
      purchasePrice: inputs.purchasePrice,
      rehabBudget: inputs.rehabBudget,
      acquisitionCosts: inputs.acquisitionCosts,
      totalInvestment,

      afterRepairValue: inputs.afterRepairValue,
      refinanceLTV: inputs.refinanceLTV,
      refinanceLoanAmount,
      refinanceClosingCosts: inputs.refinanceClosingCosts,
      totalRefinanceProceeds,

      originalMortgageBalance,
      capitalRecovered,
      capitalRemaining,
      capitalRecoveryRate,

      monthlyСashFlow,
      effectiveCashOnCash,
      infiniteReturn,

      newMortgageBalance: refinanceLoanAmount,
      newMonthlyPayment,
      newInterestRate: inputs.interestRate,
      newLoanTerm: 360
    };
  }

  private calculateMortgageBalance(
    originalLoan: number,
    downPayment: number,
    interestRate: number,
    monthsPaid: number
  ): number {
    // Amortization formula to calculate remaining balance
    // after seasoning period
  }

  private calculateMortgagePayment(
    loanAmount: number,
    interestRate: number,
    months: number
  ): number {
    // Standard mortgage payment formula
  }
}
```

---

### Controller Integration (Strategy-Aware Analysis)

**File**: `/backend/src/controllers/deals.ts`

```typescript
router.post('/api/deals/analyze', async (req, res) => {
  const { propertyData, strategy } = req.body;

  // ALWAYS run standard SFR analysis (all 28 metrics)
  const standardAnalysis = await SFRAnalyzer.analyze(propertyData);

  // Run strategy-specific enhancements
  let strategyAnalysis = null;

  if (strategy === 'BRRRR') {
    // Validate BRRRR-specific inputs
    if (!propertyData.rehabBudget || !propertyData.afterRepairValue) {
      return res.status(400).json({
        error: 'BRRRR strategy requires rehab budget and ARV'
      });
    }

    strategyAnalysis = await BRRRRAnalyzer.analyze(propertyData);
  }

  if (strategy === 'House Hacking') {
    // Phase 3 - future implementation
    strategyAnalysis = await HouseHackingAnalyzer.analyze(propertyData);
  }

  // Return combined analysis
  res.json({
    verdict: standardAnalysis.verdict,
    score: standardAnalysis.score,
    metrics: standardAnalysis.metrics,
    strategySpecific: strategyAnalysis,  // BRRRR-specific metrics if applicable
  });
});
```

---

## Phase 2: Frontend Architecture

### Step 2 Enhancement: Conditional BRRRR Fields

**File**: `/frontend/src/components/SFRAnalysis/FinancingStep.tsx`

```typescript
export function FinancingStep({ state, onUpdate }: StepProps) {
  const strategy = state.data.strategy; // From Step 0

  return (
    <Box>
      {/* Standard Fields (All Strategies) */}
      <TextField
        label="Purchase Price"
        value={state.data.purchasePrice}
        onChange={(e) => onUpdate({
          data: { ...state.data, purchasePrice: Number(e.target.value) }
        })}
        required
      />

      <TextField
        label="Down Payment"
        value={state.data.downPaymentPercent}
        onChange={(e) => onUpdate({
          data: { ...state.data, downPaymentPercent: Number(e.target.value) }
        })}
        required
      />

      {/* BRRRR-Specific Fields (Conditional) */}
      {strategy === 'BRRRR' && (
        <Box sx={{ mt: 3, p: 3, backgroundColor: 'purple.50', borderRadius: '12px' }}>
          <Typography variant="h6" gutterBottom>
            BRRRR Strategy Details
          </Typography>

          <TextField
            label="Rehab Budget"
            type="number"
            value={state.data.rehabBudget || ''}
            onChange={(e) => onUpdate({
              data: { ...state.data, rehabBudget: Number(e.target.value) }
            })}
            helperText="Estimated renovation costs"
            required
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="After Repair Value (ARV)"
            type="number"
            value={state.data.afterRepairValue || ''}
            onChange={(e) => onUpdate({
              data: { ...state.data, afterRepairValue: Number(e.target.value) }
            })}
            helperText="Property value after renovation"
            required
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Refinance LTV %"
            type="number"
            value={state.data.refinanceLTV || 70}
            onChange={(e) => onUpdate({
              data: { ...state.data, refinanceLTV: Number(e.target.value) }
            })}
            helperText="Typical: 70-75% of ARV"
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Seasoning Period"
            type="number"
            value={state.data.seasoningPeriod || 6}
            onChange={(e) => onUpdate({
              data: { ...state.data, seasoningPeriod: Number(e.target.value) }
            })}
            helperText="Months before refinance (6-12 typical)"
            InputProps={{
              endAdornment: <InputAdornment position="end">months</InputAdornment>
            }}
            fullWidth
          />
        </Box>
      )}
    </Box>
  );
}
```

---

### BRRRR Results Display

**File**: `/frontend/src/components/SFRAnalysis/BRRRRResultsTab.tsx` (NEW)

```typescript
interface BRRRRResultsTabProps {
  analysis: BRRRRAnalysis;
}

export function BRRRRResultsTab({ analysis }: BRRRRResultsTabProps) {
  return (
    <Box>
      {/* Infinite Return Badge (If Achieved) */}
      {analysis.infiniteReturn && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>♾️ Infinite Return Achieved!</AlertTitle>
          You've recovered all invested capital through the refinance.
          This property now generates cash flow with $0 of your money remaining in the deal.
        </Alert>
      )}

      {/* Investment Phase */}
      <Typography variant="h6" gutterBottom>
        Investment Phase
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Purchase Price"
            value={formatCurrency(analysis.purchasePrice)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Rehab Budget"
            value={formatCurrency(analysis.rehabBudget)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Total Investment"
            value={formatCurrency(analysis.totalInvestment)}
            highlight
          />
        </Grid>
      </Grid>

      {/* Refinance Phase */}
      <Typography variant="h6" gutterBottom>
        Refinance Phase
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="After Repair Value (ARV)"
            value={formatCurrency(analysis.afterRepairValue)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Refinance Loan Amount"
            value={formatCurrency(analysis.refinanceLoanAmount)}
            helpText={`${analysis.refinanceLTV}% of ARV`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Refinance Proceeds"
            value={formatCurrency(analysis.totalRefinanceProceeds)}
            highlight
          />
        </Grid>
      </Grid>

      {/* Capital Recovery */}
      <Typography variant="h6" gutterBottom>
        Capital Recovery
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Capital Recovered"
            value={formatCurrency(analysis.capitalRecovered)}
            trend={analysis.capitalRecovered > 0 ? 'positive' : 'negative'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Capital Remaining in Deal"
            value={formatCurrency(Math.max(0, analysis.capitalRemaining))}
            trend={analysis.infiniteReturn ? 'positive' : 'neutral'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Capital Recovery Rate"
            value={`${analysis.capitalRecoveryRate.toFixed(1)}%`}
            benchmark="100% = infinite return"
            highlight
          />
        </Grid>
      </Grid>

      {/* Returns */}
      <Typography variant="h6" gutterBottom>
        Returns & Cash Flow
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Monthly Cash Flow"
            value={formatCurrency(analysis.monthlyСashFlow)}
            trend={analysis.monthlyСashFlow > 0 ? 'positive' : 'negative'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Effective Cash-on-Cash"
            value={
              analysis.infiniteReturn
                ? '∞%'
                : `${analysis.effectiveCashOnCash.toFixed(1)}%`
            }
            benchmark="15%+ excellent for BRRRR"
            highlight
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="New Monthly Mortgage"
            value={formatCurrency(analysis.newMonthlyPayment)}
            helpText="After refinance"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

### Strategy-Aware Metrics Display

**File**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx`

```typescript
export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const strategy = analysis.strategySelected; // From Deal metadata

  // Strategy-aware metric filtering
  const getNoviceMetrics = () => {
    const baseMetrics = [
      'monthlyСashFlow',
      'cashOnCashReturn',
      'totalCashNeeded',
      'monthlyMortgage',
      'capRate'
    ];

    // BRRRR: Don't show IRR (Josh's feedback - "IRR doesn't matter")
    if (strategy === 'BRRRR') {
      return baseMetrics; // IRR not included
    }

    // Buy & Hold: Include IRR
    if (strategy === 'Buy & Hold') {
      return [...baseMetrics, 'irr'];
    }

    return baseMetrics;
  };

  return (
    <Box>
      {/* Investment Decision Hero */}
      <InvestmentDecisionHero
        verdict={analysis.verdict}
        score={analysis.score}
      />

      {/* Strategy-Specific Tab (If BRRRR) */}
      {strategy === 'BRRRR' && analysis.strategySpecific && (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tab label="Overview" />
          <Tab label="BRRRR Analysis" />
          <Tab label="Professional Metrics" />
        </Tabs>
      )}

      {activeTab === 0 && (
        <NoviceMetricsView
          metrics={analysis.metrics}
          visibleMetrics={getNoviceMetrics()}
        />
      )}

      {activeTab === 1 && strategy === 'BRRRR' && (
        <BRRRRResultsTab analysis={analysis.strategySpecific} />
      )}

      {activeTab === 2 && (
        <ProfessionalMetricsView metrics={analysis.metrics} />
      )}
    </Box>
  );
}
```

---

## Implementation Roadmap

### Phase 1: Universal Simple (2 weeks)

**Week 1**:
- [ ] Create ExpandableField component
- [ ] Create HybridSliderInput component
- [ ] Create AdvancedAssumptions accordion
- [ ] Create StrategyStep (Step 0)
- [ ] Modify PropertyWizard (reorder steps, remove Step 4)

**Week 2**:
- [ ] Modify FinancingStep (add expandable tax/insurance)
- [ ] Modify RentalStep (hybrid slider for rent)
- [ ] Create NoviceMetricsView component
- [ ] Modify AnalysisResults (add progressive disclosure toggle)
- [ ] Testing with Josh's feedback scenarios

**Success Criteria**:
- ✅ Time-to-first-analysis: <5 minutes
- ✅ Required fields: 8 (down from ~25)
- ✅ Josh approval: "Simple enough for my students"

---

### Phase 2: BRRRR-Specific Features (2-3 weeks)

**Week 1**:
- [ ] Create BRRRRAnalyzer service (backend)
- [ ] Add BRRRR calculation methods
- [ ] Add BRRRR validation rules
- [ ] Update deals controller (strategy-aware routing)
- [ ] Update Deal model (BRRRR fields)

**Week 2**:
- [ ] Modify FinancingStep (conditional BRRRR fields)
- [ ] Create BRRRRResultsTab component
- [ ] Add infinite return detection & celebration
- [ ] Strategy-aware metric filtering (hide IRR for BRRRR)
- [ ] BRRRR-specific help content

**Week 3**:
- [ ] End-to-end testing (BRRRR scenarios)
- [ ] Josh Lupo demo & feedback
- [ ] Performance optimization
- [ ] Documentation updates

**Success Criteria**:
- ✅ BRRRR strategy selection: 15-20% of analyses
- ✅ Infinite return calculation accurate
- ✅ Josh approval: "This is exactly what BRRRR investors need"
- ✅ SEO traffic: 50+ signups/month within 3 months

---

## Risk Mitigation

### Technical Risks

**Risk 1: Progressive disclosure confusing for users**
- **Mitigation**: A/B test different patterns with Josh's students
- **Fallback**: Always-visible fields with smart defaults

**Risk 2: BRRRR calculations inaccurate**
- **Mitigation**: Validate against DealCheck, BiggerPockets calculators
- **Testing**: 10+ real BRRRR scenarios from Josh's portfolio

**Risk 3: Smart defaults wrong for specific markets**
- **Mitigation**: Allow easy override, show "Customized" badge
- **Future**: Improve defaults with more granular ZIP code data

### UX Risks

**Risk 1: Users don't discover advanced fields**
- **Mitigation**: Analytics tracking expansion rates
- **Fallback**: Tooltip prompts for power users

**Risk 2: Novice metrics still too many**
- **Mitigation**: A/B test 5 vs 7 metrics
- **User Research**: Josh's students feedback

---

## Success Metrics

### Phase 1 Metrics
- **Time-to-first-analysis**: <5 minutes (from ~12 minutes)
- **Wizard completion rate**: >75% (from ~55%)
- **Advanced assumptions expansion**: 10-15% of users
- **Professional metrics viewed**: 30-40% of users
- **Josh approval**: "Simple enough for my students"

### Phase 2 Metrics
- **BRRRR strategy selection**: 15-20% of analyses
- **SEO traffic (BRRRR keywords)**: 50+ signups/month within 3 months
- **User retention (BRRRR users)**: 3x deal volume vs buy & hold
- **Revenue**: $2,940 MRR from BRRRR-acquired users within 6 months
- **Josh partnership conversion**: 1,000-5,000 students onboarded

---

## Appendix: Architecture Decisions Record (ADR)

### ADR-1: Frontend-Only Phase 1 (No Backend Changes)
**Decision**: Phase 1 uses existing Investment Decision Engine without modifications

**Rationale**:
- Faster time to market (2 weeks vs 4 weeks)
- Lower risk (no backend regression)
- Validates UX improvements before backend investment

**Trade-offs**:
- Backend still calculates all 28 metrics (minor waste)
- Smart defaults computed client-side (could be server-optimized)

---

### ADR-2: BRRRR as Wrapper (Not Independent Service)
**Decision**: BRRRRAnalyzer calls SFRAnalyzer, then adds BRRRR-specific calculations

**Rationale**:
- Code reuse (mortgage, tax, insurance calculations)
- BRRRR investors still care about standard metrics (DSCR, Cap Rate)
- Easier to maintain (DRY principle)

**Trade-offs**:
- Slight performance overhead (two calculation passes)
- Coupling between BRRRR and SFR analyzers

---

### ADR-3: Progressive Disclosure (Not Removal)
**Decision**: Hide advanced fields, don't remove them

**Rationale**:
- Josh's feedback: "Property tax/insurance should be visible, but adjustable"
- Power users need control (BRRRR investors often customize)
- Data quality improves with easy override path

**Trade-offs**:
- More complex UI logic (expandable states)
- Need analytics to track usage patterns

---

### ADR-4: Strategy-Aware Presentation (Not Calculation)
**Decision**: Backend calculates all metrics, frontend filters based on strategy

**Rationale**:
- Clean separation of concerns (calculation vs presentation)
- Easier A/B testing (change frontend filtering logic)
- Future flexibility (user preferences for metrics)

**Trade-offs**:
- Backend calculates metrics user might not see
- API response larger (all 28 metrics always returned)

---

**Document Version**: 1.0
**Last Updated**: December 10, 2025
**Status**: ✅ Technical architecture defined, ready for UX design specifications
