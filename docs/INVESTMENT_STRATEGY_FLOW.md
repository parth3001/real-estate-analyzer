# Investment Strategy Flow: End-to-End Documentation

**Last Updated**: December 18, 2025
**Status**: Buy & Hold (Production), BRRRR (Phase 1.3 Backend Complete), House Hacking (Planned)

---

## Overview

This document traces the complete journey of investment strategy selection from wizard Step 0 through backend analysis to frontend results display. Understanding this flow is critical for developers, QE engineers, and anyone debugging strategy-related issues.

---

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND: Property Wizard Step 0                │
│                 User Selects Strategy                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│          FRONTEND: Steps 1-3 (Address, Finance, Rental)     │
│              propertyData.strategy stored                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│               API: POST /api/deals/analyze                   │
│       Body: { ...propertyData, strategy: 'buy-hold' }       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         BACKEND: Investment Decision Engine Routing         │
│   Conditional analyzer selection based on strategy          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         BACKEND: Strategy-Specific Analysis                  │
│   Standard metrics + strategySpecific object                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         FRONTEND: Strategy-Aware Results Display             │
│   Conditional tabs and sections based on strategy           │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Frontend Strategy Selection (Step 0)

### Component: StrategySelectionStep.tsx

**Location**: `/frontend/src/components/SFRAnalysis/StrategySelectionStep.tsx`

**User Interaction**:
```jsx
<StrategyCard
  strategy="buy-hold"
  title="Buy & Hold"
  subtitle="Long-term rental income"
  badge="Most Common"
  icon={<HomeIcon />}
  selected={strategy === 'buy-hold'}
  onClick={() => onStrategyChange('buy-hold')}
/>
```

**State Management**:
```typescript
const [strategy, setStrategy] = useState<InvestmentStrategy>('buy-hold');

const handleStrategyChange = (newStrategy: InvestmentStrategy) => {
  setStrategy(newStrategy);
  // Triggers parent PropertyWizard to update propertyData.strategy
};
```

**Data Stored in PropertyWizard State**:
```typescript
const [propertyData, setPropertyData] = useState<SFRPropertyData>({
  strategy: 'buy-hold',  // ← From Step 0 selection
  // ... other property fields from Steps 1-3
});
```

**Validation**:
- Strategy selection is **REQUIRED** before proceeding to Step 1
- Default: `'buy-hold'` if user doesn't explicitly select
- BRRRR currently disabled with "Coming Soon" badge (Phase 1.3 frontend pending)

---

## Phase 2: Frontend Data Collection (Steps 1-3)

### Steps 1-3: Standard Property Data

**Strategy field persists** through all wizard steps:
```typescript
// Step 1 (Address)
propertyData.strategy = 'buy-hold';  // Unchanged

// Step 2 (Financing)
propertyData.strategy = 'buy-hold';  // Still unchanged

// Step 3 (Rental)
propertyData.strategy = 'buy-hold';  // Carried through to submission
```

**No Strategy-Specific Fields (Yet)**:
- In future: BRRRR strategy would show additional fields in Step 2 (Rehab Budget, ARV)
- Currently: All strategies collect same property data

---

## Phase 3: API Call to Backend

### Endpoint: POST /api/deals/analyze

**Request Body**:
```json
{
  "strategy": "buy-hold",
  "propertyType": "SFR",
  "purchasePrice": 250000,
  "downPayment": 50000,
  "interestRate": 7.0,
  "loanTerm": 30,
  "monthlyRent": 2000,
  // ... 40+ other property fields

  // BRRRR-specific (only if strategy='brrrr'):
  "brrrr": {
    "rehabBudget": 30000,
    "afterRepairValue": 320000,
    "refinanceLTV": 75,
    "seasoningPeriod": 12
  }
}
```

**Frontend Code** (`/frontend/src/services/api.ts`):
```typescript
export const analyzeProperty = async (propertyData: SFRPropertyData) => {
  const response = await axios.post('/api/deals/analyze', propertyData);
  return response.data;  // Returns Analysis object
};
```

---

## Phase 4: Backend Controller Validation

### File: `/backend/src/controllers/deals.ts`

**Conditional BRRRR Validation** (Lines 892-921):
```typescript
// If investmentStrategy is 'brrrr', validate that brrrr object exists
if (dealData.investmentStrategy === 'brrrr') {
  logger.info('BRRRR strategy detected - validating BRRRR data');

  if (!dealData.brrrr) {
    logger.warn('BRRRR strategy specified but brrrr object is missing');
    res.status(400).json({
      error: 'BRRRR strategy requires brrrr object with rehabBudget, afterRepairValue, refinanceLTV, and seasoningPeriod'
    });
    return;  // ← Prevents server crash at brrrAnalyzer.ts:179
  }

  // Use existing validation layer from Phase 0
  const validation = validateBRRRRInputs(dealData);

  if (validation.errors.length > 0) {
    logger.warn('BRRRR validation failed', { errors: validation.errors });
    res.status(400).json({
      error: validation.errors[0].message,
      validationErrors: validation.errors
    });
    return;
  }
}
```

**Critical Protection**:
- Without this validation, `brrrAnalyzer.ts:179` would crash trying to read `inputs.brrrr.rehabBudget`
- Returns 400 Bad Request instead of 500 Internal Server Error

---

## Phase 5: Backend Analysis Routing

### Current Implementation (December 2025)

**File**: `/backend/src/controllers/deals.ts`

**Strategy Routing Logic** (Simplified):
```typescript
const investmentStrategy = dealData.investmentStrategy || 'buy-hold';

let analysis: Analysis;

switch (investmentStrategy) {
  case 'buy-hold':
    // Standard SFR/MF analyzer
    if (dealData.propertyType === 'SFR') {
      analysis = await SFRAnalyzer.analyze(dealData);
    } else {
      analysis = await MultiFamilyAnalyzer.analyze(dealData);
    }
    break;

  case 'brrrr':
    // BRRRR-specific analyzer (Phase 1.3)
    analysis = await BRRRRAnalyzer.analyze(dealData);
    break;

  case 'house-hack':
    // House hacking analyzer (future)
    analysis = await HouseHackAnalyzer.analyze(dealData);
    break;

  default:
    // Fallback to standard analyzer
    analysis = await SFRAnalyzer.analyze(dealData);
}
```

**Current Reality (Phase 1.3)**:
- **Buy & Hold**: ✅ Full implementation via SFRAnalyzer/MultiFamilyAnalyzer
- **BRRRR**: ⚠️ Backend complete, but frontend Step 0 shows "Coming Soon"
- **House Hacking**: ❌ Not implemented (placeholder only)

---

## Phase 6: Strategy-Specific Analysis

### Buy & Hold Strategy (Production)

**Analyzer**: `/backend/src/services/SFRAnalyzer.ts`

**Standard Metrics Calculated**:
- Monthly Analysis: Cash flow, income, expenses, mortgage breakdown
- Annual Analysis: NOI, DSCR, Cap Rate, Cash-on-Cash Return
- Long-term Projections: IRR, equity growth, appreciation
- Investment Decision: Verdict, Deal Quality Score, recommendations

**strategySpecific Field**:
```typescript
analysis.strategySpecific = null;  // Buy & Hold has no extra calculations
```

---

### BRRRR Strategy (Phase 1.3 Backend Complete)

**Analyzer**: `/backend/src/services/investment/brrrAnalyzer.ts` (Phase 0 validation layer)

**Additional BRRRR Calculations**:
```typescript
analysis.strategySpecific = {
  // Capital Recovery Analysis
  totalCapitalInvested: 133000,           // Purchase + closing + rehab
  afterRepairValue: 180000,                // From user input
  refinanceLoanAmount: 135000,             // ARV × refinanceLTV (75%)

  // Recovery Metrics
  capitalRecoveryAmount: 55000,            // New loan - original loan
  capitalRecoveryRate: 41.4,               // % of capital recovered
  capitalLeftInDeal: 78000,                // Capital still invested
  achievesInfiniteReturn: false,           // true if recovery >= 100%

  // Post-Refinance Performance
  postRefinanceCashFlow: 90,               // Monthly cash flow after refi
  postRefinanceCoC: 1.38,                  // CoC return on remaining capital

  // Timeline
  seasoningPeriod: 12,                     // Months before refinance allowed
  estimatedRehabTime: 0,                   // User input (optional)
  totalTimeline: 12                        // Rehab + seasoning
};
```

**Formula Details**: See [DATA_DICTIONARY.md - BRRRR Calculation Methodology](./DATA_DICTIONARY.md#brrrr-calculation-methodology-phase-13)

---

### House Hacking Strategy (Planned)

**Analyzer**: `/backend/src/services/investment/houseHackAnalyzer.ts` (Not yet implemented)

**Planned Calculations**:
```typescript
analysis.strategySpecific = {
  // Housing Cost Offset
  monthlyRentCollected: 3000,              // From rented units
  monthlyHousingCostReduction: 2200,       // Rent - mortgage/expenses
  effectiveLivingCost: 800,                // User's net housing cost

  // Comparison to Renting
  marketRentForSimilarUnit: 1500,          // What user would pay to rent
  monthlySavings: 700,                     // Market rent - effective cost
  annualSavingsVsRenting: 8400,            // Savings × 12

  // Wealth Building
  principalPaydownFromRent: 450,           // Renters pay down your mortgage
  equityBuildRate: 15.2,                   // % equity increase per year

  // FHA 3.5% Down Leverage
  downPaymentRequired: 8750,               // 3.5% of $250K purchase
  leverageMultiplier: 28.6                 // Asset value / cash invested
};
```

---

## Phase 7: Frontend Results Display

### Component: AnalysisResults.tsx

**Strategy-Aware Rendering**:
```typescript
const strategy = analysis?.strategy || propertyData?.strategy || 'buy-hold';

// Standard tabs (all strategies)
<Tab label="Monthly Analysis" />
<Tab label="Long-term Projections" />
<Tab label="Investment Decision" />

// Conditional BRRRR tab
{strategy === 'brrrr' && analysis?.strategySpecific && (
  <Tab label="Capital Recovery" />
)}

// Conditional House Hack tab
{strategy === 'house-hack' && analysis?.strategySpecific && (
  <Tab label="Housing Cost Offset" />
)}
```

**BRRRR-Specific Display** (Future):
```jsx
{strategy === 'brrrr' && analysis.strategySpecific && (
  <BRRRRAnalysisTab
    capitalRecoveryRate={analysis.strategySpecific.capitalRecoveryRate}
    postRefinanceCashFlow={analysis.strategySpecific.postRefinanceCashFlow}
    achievesInfiniteReturn={analysis.strategySpecific.achievesInfiniteReturn}
    // ... other BRRRR metrics
  />
)}
```

---

## Strategy Comparison Matrix

### What's Different Between Strategies?

| Aspect | Buy & Hold | BRRRR | House Hacking |
|--------|------------|-------|---------------|
| **Primary Goal** | Long-term cash flow + appreciation | Capital recycling (infinite return) | Reduce personal housing costs |
| **Target User** | All experience levels | Advanced (year 3+) | First-time investors |
| **Key Metrics** | Cap Rate, IRR, Cash Flow | Capital Recovery Rate, Infinite Return | Housing Cost Offset, Effective Living Cost |
| **Risk Level** | Low-Medium | High (rehab, appraisal risk) | Low (FHA 3.5% down) |
| **Timeline** | 10-30 years hold | 6-24 months to refinance | 1-5 years live-in |
| **Backend Analyzer** | SFRAnalyzer.ts | brrrAnalyzer.ts | houseHackAnalyzer.ts (planned) |
| **Frontend Status** | ✅ Production | ⚠️ Coming Soon (Phase 1.3 backend done) | ❌ Planned |
| **Extra Fields** | None | rehabBudget, ARV, refinanceLTV, seasoningPeriod | None (FHA down payment handled automatically) |
| **strategySpecific** | null | BRRRRAnalysis object | HouseHackAnalysis object (planned) |

---

## Testing Strategy-Specific Flows

### Unit Tests

**Backend Analyzer Tests**:
```javascript
// /backend/tests/brrrr-analyzer-smoke-test.js
describe('BRRRR Analyzer', () => {
  it('calculates capital recovery rate correctly', () => {
    const result = BRRRRAnalyzer.analyze(mockBRRRRProperty);
    expect(result.strategySpecific.capitalRecoveryRate).toBe(41.6);
  });

  it('identifies infinite return achievement', () => {
    const result = BRRRRAnalyzer.analyze(perfectBRRRRDeal);
    expect(result.strategySpecific.achievesInfiniteReturn).toBe(true);
  });
});
```

**Frontend Strategy Selection Tests**:
```typescript
// /frontend/src/components/__tests__/StrategySelectionStep.test.tsx
describe('Strategy Selection Step', () => {
  it('defaults to buy-hold strategy', () => {
    render(<StrategySelectionStep />);
    expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName(/Buy.*Hold/);
  });

  it('shows BRRRR as coming soon', () => {
    render(<StrategySelectionStep />);
    expect(screen.getByText(/BRRRR/)).toHaveAttribute('aria-disabled', 'true');
  });
});
```

---

### Integration Tests

**Schema Migration Tests** (6 tests, all passing):
```javascript
// /backend/tests/brrrr-schema-migration-test.js

Test 1: Old deals load with default "buy-hold" strategy ✅
Test 2: BRRRR deals save with all fields ✅
Test 3: analysis.strategySpecific saves BRRRR results ✅
Test 4: Strategy change from buy-hold → brrrr works ✅
Test 5: BRRRR strategy without brrrr object rejected ✅ (Fixed Test 5 gap)
Test 6: SFR regression - Buy & Hold unchanged ✅
```

---

### E2E Tests (Cypress)

**Complete BRRRR Flow** (When frontend enabled):
```javascript
describe('BRRRR Strategy End-to-End', () => {
  it('completes BRRRR wizard and displays capital recovery analysis', () => {
    // Step 0: Select BRRRR strategy
    cy.visit('/wizard');
    cy.get('[data-testid="strategy-brrrr"]').click();
    cy.get('[data-testid="next-button"]').click();

    // Step 1-3: Standard property data
    cy.fillPropertyWizard({
      address: '123 Renovation St',
      city: 'Austin',
      state: 'TX',
      purchasePrice: 130000,
      downPayment: 26000,
      monthlyRent: 1500
    });

    // Step 2: BRRRR-specific fields revealed
    cy.get('[data-testid="rehab-budget"]').type('30000');
    cy.get('[data-testid="after-repair-value"]').type('180000');
    cy.get('[data-testid="refinance-ltv"]').clear().type('75');
    cy.get('[data-testid="seasoning-period"]').clear().type('12');

    // Submit and verify BRRRR analysis
    cy.get('[data-testid="analyze-button"]').click();
    cy.wait('@analyzeProperty');

    // Verify BRRRR-specific tab appears
    cy.get('[data-testid="tab-capital-recovery"]').should('exist').click();

    // Verify BRRRR metrics displayed
    cy.contains('Capital Recovery Rate').parent().should('contain', '41.6%');
    cy.contains('Post-Refinance Cash Flow').parent().should('contain', '$90');
    cy.contains('Infinite Return').parent().should('contain', 'Not Achieved');
  });
});
```

---

## Debugging Strategy Issues

### Common Issues and Solutions

#### Issue 1: Strategy Not Persisting Through Wizard

**Symptom**: Strategy selected in Step 0, but analysis shows Buy & Hold
**Cause**: PropertyWizard state not updating correctly
**Debug Steps**:
```typescript
// In StrategySelectionStep.tsx
console.log('Strategy selected:', strategy);  // Should log 'brrrr'

// In PropertyWizard.tsx
console.log('PropertyData strategy:', propertyData.strategy);  // Should match

// In API call
console.log('Sending to backend:', JSON.stringify(propertyData));
// Verify strategy field is in request body
```

**Fix**: Ensure `onStrategyChange` callback properly updates parent state

---

#### Issue 2: BRRRR Validation Failing

**Symptom**: 400 error "BRRRR strategy requires brrrr object"
**Cause**: Frontend not sending brrrr object when strategy='brrrr'
**Debug Steps**:
```bash
# Check backend logs
cd backend && tail -f logs/combined.log | grep BRRRR

# Expected log:
# "BRRRR strategy detected - validating BRRRR data"
# "BRRRR validation passed"

# If seeing: "BRRRR strategy specified but brrrr object is missing"
# → Frontend not sending brrrr fields
```

**Fix**: Verify FinancialsStep shows BRRRR fields when strategy='brrrr'

---

#### Issue 3: strategySpecific Not Displaying

**Symptom**: Analysis completes, but BRRRR tab not showing
**Cause**: Conditional rendering check failing
**Debug Steps**:
```typescript
// In AnalysisResults.tsx
console.log('Strategy:', analysis?.strategy || propertyData?.strategy);
console.log('Has strategySpecific:', !!analysis?.strategySpecific);
console.log('strategySpecific content:', analysis?.strategySpecific);

// Expected for BRRRR:
// Strategy: "brrrr"
// Has strategySpecific: true
// strategySpecific content: { capitalRecoveryRate: 41.6, ... }
```

**Fix**: Verify backend analyzer is setting `analysis.strategySpecific` correctly

---

## Database Schema

### Deal Model (MongoDB)

**Fields Added for Strategy Support** (Phase 1.3):
```typescript
{
  investmentStrategy: {
    type: String,
    enum: ['buy-hold', 'brrrr', 'house-hack'],
    default: 'buy-hold',
    required: false
  },

  brrrr: {
    rehabBudget: Number,           // Required if strategy='brrrr'
    afterRepairValue: Number,       // Required if strategy='brrrr'
    refinanceLTV: Number,           // 65-80%, default 75
    seasoningPeriod: Number,        // 6-24 months, default 12
    estimatedRehabTime: Number,     // Optional
    arvAppraisalConfidence: String  // 'conservative'|'moderate'|'aggressive'
  },

  analysis: {
    // Standard metrics (all strategies)
    keyMetrics: { ... },
    monthlyAnalysis: { ... },
    longTermAnalysis: { ... },

    // Strategy-specific results
    strategySpecific: Schema.Types.Mixed  // Flexible type for any strategy
  }
}
```

**Database Indexes** (Phase 1.3):
```javascript
// Strategy filtering
DealSchema.index({ investmentStrategy: 1 });

// User + Strategy (most common query)
DealSchema.index({ userId: 1, investmentStrategy: 1 });
```

---

## Future Enhancements

### Phase 2: BRRRR Frontend Implementation

**Tasks**:
1. Enable BRRRR strategy card in Step 0 (remove "Coming Soon" badge)
2. Add BRRRR fields to FinancialsStep (conditional rendering)
3. Create BRRRRAnalysisTab component
4. Add Capital Recovery metrics to results display
5. E2E tests for complete BRRRR flow

**Estimated Effort**: 2-3 days

---

### Phase 3: House Hacking Strategy

**Tasks**:
1. Create HouseHackAnalyzer backend service
2. Add house hacking calculations (housing cost offset, FHA leverage)
3. Enable House Hacking strategy card in Step 0
4. Create HouseHackAnalysisTab component
5. Update documentation and tests

**Estimated Effort**: 1 week

---

### Phase 4: Multi-Strategy Comparison

**Feature**: Allow users to analyze same property with multiple strategies

**Example Use Case**:
- "Should I BRRRR this property or just Buy & Hold?"
- Side-by-side comparison of capital recovery vs long-term cash flow

**Implementation**:
- Analyze button with "Compare Strategies" option
- Backend runs multiple analyzers on same property
- Frontend displays comparison table

**Estimated Effort**: 1-2 weeks

---

## Related Documentation

- [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) - Schema documentation + BRRRR calculations
- [FRONTEND_UX_ARCHITECTURE.md](./FRONTEND_UX_ARCHITECTURE.md) - Component architecture
- [PROPERTY_WIZARD_FIELD_DOCUMENTATION.md](./PROPERTY_WIZARD_FIELD_DOCUMENTATION.md) - Field catalog
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

## Version History

- **December 18, 2025**: Created comprehensive investment strategy flow documentation
- **December 10, 2025**: Phase 1.3 BRRRR backend complete, frontend pending
- **December 10, 2025**: Step 0 strategy selection implemented (4-step wizard)
