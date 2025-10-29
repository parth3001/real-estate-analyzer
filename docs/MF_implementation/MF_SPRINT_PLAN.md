# Multi-Family Feature - Sprint Plan (13 Weeks)

**Start Date**: TBD (After user approval)
**End Date**: +13 weeks
**Sprint Duration**: 2 weeks
**Total Sprints**: 6 sprints + 1 week buffer
**Velocity**: ~27 hours/week (flexible based on marketing demands)

**Status**: ✅ **APPROVED - READY TO EXECUTE**

---

## 📊 **SPRINT OVERVIEW** (CORRECTED DEPENDENCY ORDER)

| Sprint | Weeks | Focus Area | Hours | Key Deliverable |
|--------|-------|------------|-------|-----------------|
| **Sprint 1** | 1-2 | MultiFamilyAnalyzer Core | 80h | Complete analyzer outputting AnalysisResult<MultiFamilyMetrics> |
| **Sprint 2** | 3-4 | Investment Decision Engine Refactor | 80h | Base class pattern consuming MF analyzer output |
| **Sprint 3** | 5-6 | RentCast + Property Wizard | 64h | MF wizard flow |
| **Sprint 4** | 7-8 | Results Display + Unit Mix UI | 54h | Results tabs |
| **Sprint 5** | 9-10 | AI Enhancement + Portfolio | 40h | AI insights |
| **Sprint 6** | 11-12 | Testing + Integration | 52h | Beta ready |
| **Buffer** | 13 | Polish + Bug Fixes | 32h | Production ready |

**Total**: 398 hours (avg 30.6 hours/week with buffer)

**⚠️ CRITICAL DEPENDENCY**: Sprint 1 MUST complete before Sprint 2 begins. Investment Decision Engine cannot be refactored until MultiFamilyAnalyzer outputs the proper data structure.

---

## 🏃 **SPRINT 1: MULTIFAMILYANALYZER CORE (FOUNDATION)**

**Weeks**: 1-2
**Total Hours**: 80 hours
**Goal**: Complete MultiFamilyAnalyzer to match SFR sophistication and output proper data structures

**⚠️ WHY THIS MUST BE SPRINT 1**: Investment Decision Engine (Sprint 2) requires MultiFamilyAnalyzer to output `AnalysisResult<MultiFamilyMetrics>`. We cannot refactor the decision engine until this data structure exists and is tested.

### **Epic**: Complete Multi-Family Property Analysis Engine

#### **Stories**:

##### **Story 1.1: Create BaseDecisionEngine Abstract Class** (16 hours)
```typescript
// /backend/src/services/investment/baseDecisionEngine.ts (NEW)
export abstract class BaseDecisionEngine<T extends BasePropertyData, U extends CommonMetrics> {

  // Abstract methods (property-specific)
  protected abstract getScoringWeights(): ProfessionalWeights;
  protected abstract calculateWalkAwayPrice(analysis: any, propertyData: T): number;
  protected abstract assessPropertyFundamentals(analysis: any, propertyData: T): any;
  protected abstract extractPropertyRisk(propertyData: T): number;

  // Concrete methods (shared logic)
  protected calculateDealQuality(analysis: AnalysisResult<U>, weights: ProfessionalWeights): number {
    // Shared scoring logic
  }

  protected generateMarketContext(marketData: MarketDataResponse): MarketContextAnalysis {
    // Shared market analysis
  }

  protected generateInvestmentTimeline(analysis: any): InvestmentTimeline {
    // Shared timeline generation
  }

  // Main method
  public async generateDecision(
    analysis: AnalysisResult<U>,
    propertyData: T,
    marketData?: MarketDataResponse
  ): Promise<InvestmentDecision> {
    // Orchestrates abstract + concrete methods
  }
}
```

**Acceptance Criteria**:
- [ ] Abstract class compiles with generics
- [ ] All abstract methods defined
- [ ] Shared logic extracted from current engine
- [ ] TypeScript interfaces updated
- [ ] Unit tests for shared methods

**Files Created**:
- `/backend/src/services/investment/baseDecisionEngine.ts`

---

##### **Story 1.2: Extract Shared Logic from Investment Decision Engine** (24 hours)
**Task**: Identify and extract property-agnostic logic

**Shared Logic to Extract** (60% of code):
1. `calculateDealQuality()` - Weighted scoring (lines 1100-1200)
2. `generateMarketContext()` - Market analysis (lines 1512-1650)
3. `generateInvestmentTimeline()` - Timeline creation (lines 2459-2580)
4. `generateAlternatives()` - Alternative investments (lines 1427-1511)
5. `generateGoalContext()` - Goal alignment (lines 2068-2287)
6. `generatePortfolioContext()` - Portfolio fit (lines 2288-2458)
7. `generateAISensitivityContext()` - AI integration (lines 3319-3424)

**Acceptance Criteria**:
- [ ] 7 shared methods extracted to BaseDecisionEngine
- [ ] No property-specific logic in shared methods
- [ ] All methods have unit tests
- [ ] Code coverage >85%

**Estimated Lines**: ~2,100 lines of shared logic

---

##### **Story 1.3: Refactor SFR to SFRDecisionEngine** (24 hours)
```typescript
// /backend/src/services/investment/sfrDecisionEngine.ts (NEW)
export class SFRDecisionEngine extends BaseDecisionEngine<SFRData, SFRMetrics> {

  protected getScoringWeights(): ProfessionalWeights {
    return {
      cashFlow: 0.35,      // SFR-specific weight
      irr: 0.25,
      capRate: 0.03,
      dscr: 0.10,
      marketStrength: 0.15,
      exitStrategy: 0.10,
      propertyRisk: 0.02
    };
  }

  protected calculateWalkAwayPrice(analysis: any, propertyData: SFRData): number {
    // SFR-specific: Based on monthly rent × 12 / target CoC
    const targetCashOnCash = 0.12; // 12% target
    const monthlyRent = propertyData.monthlyRent;
    // ... SFR walk-away logic
  }

  protected assessPropertyFundamentals(analysis: any, propertyData: SFRData) {
    return {
      propertyType: 'SFR',
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFootage: propertyData.squareFootage,
      yearBuilt: propertyData.yearBuilt,
      condition: this.assessCondition(propertyData),
      // ... SFR fundamentals
    };
  }

  protected extractPropertyRisk(propertyData: SFRData): number {
    // SFR-specific risks: single tenant, condition, age
    const ageRisk = this.calculateAgeRisk(propertyData.yearBuilt);
    const conditionRisk = propertyData.condition === 'POOR' ? 30 : 0;
    const singleTenantRisk = 20; // Always 20 for SFR (100% vacancy if they leave)
    return Math.min(100, ageRisk + conditionRisk + singleTenantRisk);
  }
}
```

**Acceptance Criteria**:
- [ ] SFRDecisionEngine extends BaseDecisionEngine
- [ ] All abstract methods implemented
- [ ] Existing SFR tests still pass (100%)
- [ ] No regression in SFR functionality
- [ ] Code coverage maintained at 90%+

**Files Created**:
- `/backend/src/services/investment/sfrDecisionEngine.ts`

**Files Modified**:
- `/backend/src/services/investment/investmentDecisionEngine.ts` (becomes facade/factory)

---

##### **Story 1.4: Update Investment Decision Engine to Factory Pattern** (8 hours)
```typescript
// /backend/src/services/investment/investmentDecisionEngine.ts (REFACTORED)
import { BaseDecisionEngine } from './baseDecisionEngine';
import { SFRDecisionEngine } from './sfrDecisionEngine';
import { BasePropertyData, CommonMetrics } from '../../types/propertyTypes';

export class InvestmentDecisionEngine {
  /**
   * Factory method: Returns appropriate decision engine for property type
   */
  public static async generateDecision<T extends BasePropertyData, U extends CommonMetrics>(
    analysis: AnalysisResult<U>,
    propertyData: T,
    marketData?: MarketDataResponse
  ): Promise<InvestmentDecision> {

    // Factory pattern: Select engine based on property type
    let engine: BaseDecisionEngine<T, U>;

    if (propertyData.propertyType === 'SFR') {
      engine = new SFRDecisionEngine() as unknown as BaseDecisionEngine<T, U>;
    } else if (propertyData.propertyType === 'MF') {
      // Will be added in Sprint 2
      throw new Error('MF decision engine not yet implemented');
    } else {
      throw new Error(`Unsupported property type: ${propertyData.propertyType}`);
    }

    return engine.generateDecision(analysis, propertyData, marketData);
  }
}
```

**Acceptance Criteria**:
- [ ] Factory pattern routes to correct engine
- [ ] SFR analysis works identically to before
- [ ] All existing tests pass
- [ ] Clear error for unsupported property types

---

##### **Story 1.5: Integration Testing** (8 hours)
**Tasks**:
1. Run full SFR analysis suite (all 10 realistic scenarios)
2. Verify Investment Decision verdicts unchanged
3. Test edge cases (negative cash flow, high DSCR, etc.)
4. Performance testing (ensure no slowdown)

**Acceptance Criteria**:
- [ ] All SFR integration tests pass
- [ ] Verdicts match pre-refactor results
- [ ] Response time <200ms (same as before)
- [ ] Memory usage unchanged

**Test Files**:
- `/backend/src/tests/investment/baseDecisionEngine.test.ts` (NEW)
- `/backend/src/tests/investment/sfrDecisionEngine.test.ts` (NEW)
- `/backend/src/tests/integration/sfr-decision-regression.test.ts` (NEW)

---

### **Sprint 1 Deliverables**:
- [x] BaseDecisionEngine abstract class
- [x] SFRDecisionEngine implementation
- [x] Factory pattern in InvestmentDecisionEngine
- [x] 100% SFR test pass rate (no regressions)
- [x] Documentation updated

### **Sprint 1 Definition of Done**:
- [ ] All code merged to `feature/mf-analysis-v1` branch
- [ ] Code review completed
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests: 100% pass
- [ ] No SFR regressions
- [ ] Documentation: ARCHITECTURE_V3.md updated with base class pattern

### **Sprint 1 Risks**:
- ⚠️ **Refactoring risk**: Breaking existing SFR functionality
- **Mitigation**: Comprehensive regression testing, keep old code until verified

---

## 🏃 **SPRINT 2: MULTIFAMILYANALYZER CORE**

**Weeks**: 3-4
**Total Hours**: 62 hours
**Goal**: Build complete MultiFamilyAnalyzer matching SFR sophistication

### **Epic**: Complete Multi-Family Property Analysis Engine

#### **Stories**:

##### **Story 2.1: Enhance MultiFamilyData Interface** (4 hours)
```typescript
// /backend/src/types/propertyTypes.ts (ENHANCE EXISTING)
export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';

  // Building Details
  totalUnits: number;  // 2-32
  totalSqft: number;
  yearBuilt: number;
  buildingType?: 'SIDE_BY_SIDE' | 'STACKED' | 'MIXED' | 'COMPLEX';

  // Unit Configuration (ENHANCED for RentCast)
  units: Array<{
    unitNumber?: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    currentRent: number;
    marketRent?: number;      // From RentCast
    isVacant?: boolean;
    condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
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

**Acceptance Criteria**:
- [ ] Interface compiles with no errors
- [ ] All fields documented
- [ ] Type guards work correctly
- [ ] Validated against RentCast API response structure

---

##### **Story 2.2: Fix MultiFamilyAnalyzer NOI Calculation** (8 hours)
**Critical Bug**: Vacancy currently in operating expenses (wrong!)

```typescript
// /backend/src/analysis/MultiFamilyAnalyzer.ts (FIX)

protected calculateOperatingExpenses(grossIncome: number): number {
  const { purchasePrice, propertyTaxRate, insuranceRate, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;

  const propertyTax = purchasePrice * (propertyTaxRate / 100);
  const insurance = purchasePrice * (insuranceRate / 100);
  const propertyManagement = grossIncome * (propertyManagementRate / 100);

  // ❌ REMOVED: vacancy should reduce income, not be an expense
  // const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);

  const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;

  // Common area utilities
  const commonAreaTotal = Object.values(this.data.commonAreaUtilities || {})
    .reduce((sum, cost) => sum + (cost * 12), 0);

  // CapEx reserve (6% for MF)
  const capEx = grossIncome * 0.06;

  // ✅ FIXED: No vacancy in expenses
  return propertyTax + insurance + propertyManagement + maintenance + commonAreaTotal + capEx;
}

// ✅ NEW METHOD: Calculate EGI
protected calculateEffectiveGrossIncome(grossIncome: number): number {
  const vacancyLoss = grossIncome * (this.assumptions.vacancyRate / 100);
  const creditLoss = grossIncome * 0.02;  // 2% bad debt
  return grossIncome - vacancyLoss - creditLoss;
}

// ✅ UPDATED: Use EGI for NOI
protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
  const grossIncome = this.calculateGrossIncome(1);
  const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
  const noi = this.calculateNOI(effectiveGrossIncome, operatingExpenses);  // ✅ FIXED
  // ...
}
```

**Acceptance Criteria**:
- [ ] Vacancy handled as income reduction (not expense)
- [ ] EGI calculated correctly
- [ ] NOI = EGI - Operating Expenses
- [ ] Unit tests validate correct calculation
- [ ] Test with known property matches manual calculation

---

##### **Story 2.3: Add Missing Analyzer Methods** (24 hours)
**Add 4 critical methods from SFR**:

1. **calculateSensitivityAnalysis()** (8 hours)
```typescript
protected calculateSensitivityAnalysis(): SensitivityAnalysis {
  // Best case: +5% income, -5% expenses, +20% appreciation, DSCR threshold
  // Worst case: -5% income, +10% expenses, +30% lower appreciation

  // MF-specific: Test DSCR sensitivity (critical for commercial loans)
  const bestCaseDSCR = this.calculateDSCRScenario('best');
  const worstCaseDSCR = this.calculateDSCRScenario('worst');

  return {
    bestCase: { cashFlow, noi, dscr: bestCaseDSCR, capRate, totalReturn },
    worstCase: { cashFlow, noi, dscr: worstCaseDSCR, capRate, totalReturn }
  };
}
```

2. **normalizeOutput()** (6 hours)
```typescript
private normalizeOutput(result: AnalysisResult<MultiFamilyMetrics>): AnalysisResult<MultiFamilyMetrics> {
  // Transform backend calculation structure to frontend-expected format
  // Flatten expense breakdown
  // Add mortgage object
  // Ensure all required properties exist
  return normalized;
}
```

3. **fetchMarketData()** (6 hours)
```typescript
private async fetchMarketData(): Promise<{
  marketData: MarketDataResponse | null;
  marketInsights: MarketInsight[];
  investmentTiming: InvestmentTimingAnalysis | null;
}> {
  // Fetch comprehensive MF market data
  // Include MF-specific comps (5+ unit buildings)
  return { marketData, marketInsights, investmentTiming };
}
```

4. **analyzeWithMarketIntelligence()** (4 hours)
```typescript
public async analyzeWithMarketIntelligence(): Promise<AnalysisResult<MultiFamilyMetrics> & {
  marketData?: MarketDataResponse;
  marketInsights?: MarketInsight[];
  investmentTiming?: InvestmentTimingAnalysis;
}> {
  const result = super.analyze();
  const normalized = this.normalizeOutput(result);
  const { marketData, marketInsights, investmentTiming } = await this.fetchMarketData();
  return { ...normalized, marketData, marketInsights, investmentTiming };
}
```

**Acceptance Criteria**:
- [ ] All 4 methods implemented
- [ ] Match SFR method signatures
- [ ] Unit tests for each method
- [ ] Integration test with full analysis flow

---

##### **Story 2.4: Add Advanced MF Metrics** (12 hours)
**Add MF-specific metrics missing from current implementation**:

```typescript
protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
  // ... existing metrics ...

  // ✅ ADD THESE ADVANCED METRICS:

  // 1. Gross Rent Multiplier (GRM)
  const grm = this.data.purchasePrice / grossIncome;

  // 2. Debt Yield
  const loanAmount = this.data.purchasePrice - this.data.downPayment;
  const debtYield = (noi / loanAmount) * 100;

  // 3. Break-Even Occupancy
  const breakEvenOccupancy = ((operatingExpenses + annualDebtService) / grossIncome) * 100;

  // 4. Per-Unit Metrics
  const pricePerUnit = this.data.purchasePrice / this.data.totalUnits;
  const noiPerUnit = noi / this.data.totalUnits;
  const cashFlowPerUnit = cashFlow / this.data.totalUnits;

  // 5. Rent Per Sqft
  const rentPerSqft = (grossIncome / 12) / this.data.totalSqft;

  // 6. Unit Mix Efficiency
  const unitMixEfficiency = this.calculateUnitMixEfficiency();

  // 7. Economic Vacancy Rate
  const economicVacancyRate = ((grossIncome - effectiveGrossIncome) / grossIncome) * 100;

  return {
    // ... existing metrics ...
    grm,
    debtYield,
    breakEvenOccupancy,
    pricePerUnit,
    noiPerUnit,
    cashFlowPerUnit,
    rentPerSqft,
    unitMixEfficiency,
    economicVacancyRate
  };
}
```

**Acceptance Criteria**:
- [ ] All 9 advanced metrics calculated
- [ ] Formulas match industry standards
- [ ] Unit tests validate calculations
- [ ] Comparison test with manual spreadsheet (95%+ accuracy)

---

##### **Story 2.5: Add Comprehensive Logging** (4 hours)
**Match SFR's extensive debug logging**:

```typescript
console.log('==== MF UNIFIED CALCULATION ENGINE ====');
console.log('Total Units:', this.data.totalUnits);
console.log('Gross Income:', grossIncome);
console.log('Effective Gross Income:', effectiveGrossIncome);
console.log('Operating Expenses (NO vacancy):', operatingExpenses);
console.log('NOI:', noi);
console.log('DSCR:', dscr);
console.log('Cap Rate:', capRate);
console.log('=======================================');
```

**Acceptance Criteria**:
- [ ] Logging at every calculation step
- [ ] Debug blocks for troubleshooting
- [ ] Performance logging (calculation time)
- [ ] Easy to disable in production

---

##### **Story 2.6: Unit Tests for MultiFamilyAnalyzer** (10 hours)
**Create comprehensive test suite**:

```typescript
// /backend/src/tests/MultiFamilyAnalyzer.test.ts
describe('MultiFamilyAnalyzer', () => {

  describe('NOI Calculation', () => {
    it('should not include vacancy in operating expenses', () => {
      // Test that vacancy reduces income, not adds to expenses
    });

    it('should calculate EGI correctly', () => {
      // Test EGI = GI - vacancy - credit loss
    });

    it('should calculate NOI from EGI', () => {
      // Test NOI = EGI - operating expenses
    });
  });

  describe('MF-Specific Metrics', () => {
    it('should calculate GRM correctly', () => {});
    it('should calculate debt yield correctly', () => {});
    it('should calculate break-even occupancy', () => {});
    it('should calculate per-unit metrics', () => {});
  });

  describe('Sensitivity Analysis', () => {
    it('should generate best case scenario', () => {});
    it('should generate worst case scenario', () => {});
    it('should test DSCR sensitivity', () => {});
  });

  describe('Integration', () => {
    it('should match SFR output structure', () => {
      // Verify frontend compatibility
    });

    it('should handle 2-unit duplex', () => {});
    it('should handle 8-unit building', () => {});
    it('should handle 32-unit complex', () => {});
  });
});
```

**Acceptance Criteria**:
- [ ] 30+ unit tests
- [ ] 90%+ code coverage
- [ ] All tests pass
- [ ] Edge cases covered (0 units, negative cash flow, etc.)

---

### **Sprint 2 Deliverables**:
- [x] MultiFamilyAnalyzer with 550+ lines (matching SFR)
- [x] All advanced MF metrics implemented
- [x] Sensitivity analysis
- [x] Market intelligence integration
- [x] Comprehensive unit tests (90%+ coverage)

### **Sprint 2 Definition of Done**:
- [ ] MultiFamilyAnalyzer feature-complete
- [ ] All unit tests pass (90%+ coverage)
- [ ] Integration test with real property data
- [ ] Manual calculation validation (95%+ accuracy)
- [ ] Code review completed
- [ ] Documentation: Add MF examples to DATA_DICTIONARY.md

---

## 🏃 **SPRINT 3: RENTCAST + PROPERTY WIZARD**

**Weeks**: 5-6
**Total Hours**: 64 hours
**Goal**: Integrate RentCast MF API + Build Property Wizard MF flow

### **Epic**: Multi-Family Data Collection & Rent Estimation

#### **Part A: RentCast Integration** (12 hours)

##### **Story 3.1: RentCast MF Unit Rent Estimation** (8 hours)
```typescript
// /backend/src/services/rentcastService.ts (ENHANCE)

async getMFUnitRentEstimate(params: {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
}): Promise<{
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  comparables: Array<any>;
}> {
  // Cache key: address + unit config
  const cacheKey = `mf_rent_${params.address}_${params.bedrooms}BR_${params.bathrooms}BA_${params.squareFootage}sqft`;

  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const response = await this.client.get('/avm/rent/long-term', {
    params: {
      address: params.address,
      propertyType: 'Multi-Family',  // ✅ Validated
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      squareFootage: params.squareFootage
    }
  });

  const result = {
    rent: response.data.rent,
    rentRangeLow: response.data.rentRangeLow,
    rentRangeHigh: response.data.rentRangeHigh,
    comparables: response.data.comparables || []
  };

  // Cache 30 days
  await cacheService.set(cacheKey, result, 30 * 24 * 60 * 60);

  return result;
}

async getMFPropertyRentEstimates(
  address: string,
  units: Array<{ bedrooms: number; bathrooms: number; squareFeet: number }>
): Promise<Map<string, number>> {
  // Deduplicate identical units
  const uniqueConfigs = this.deduplicateUnitConfigs(units);

  // Parallel API calls for unique configs
  const estimates = await Promise.all(
    uniqueConfigs.map(config => this.getMFUnitRentEstimate({ address, ...config }))
  );

  // Map back to all units
  const rentMap = new Map<string, number>();
  uniqueConfigs.forEach((config, index) => {
    const key = `${config.bedrooms}BR_${config.bathrooms}BA_${config.squareFeet}sqft`;
    rentMap.set(key, estimates[index].rent);
  });

  return rentMap;
}
```

**Acceptance Criteria**:
- [ ] RentCast API integration works
- [ ] Caching reduces API calls 85%
- [ ] Deduplication works (4 identical units = 1 API call)
- [ ] Error handling for API failures
- [ ] Integration test with live API

---

##### **Story 3.2: RentCast Integration Tests** (4 hours)
```typescript
// /backend/src/tests/integration/rentcast-mf.test.ts
describe('RentCast MF Integration', () => {
  it('should fetch unit-level rent estimate', async () => {
    const result = await rentcastService.getMFUnitRentEstimate({
      address: '4512 Sycamore St, Dallas, TX 75204',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 900
    });

    expect(result.rent).toBeGreaterThan(0);
    expect(result.comparables.length).toBeGreaterThan(0);
  });

  it('should deduplicate identical units', async () => {
    const units = [
      { bedrooms: 2, bathrooms: 1, squareFeet: 900 },
      { bedrooms: 2, bathrooms: 1, squareFeet: 900 },
      { bedrooms: 2, bathrooms: 1, squareFeet: 900 },
      { bedrooms: 2, bathrooms: 1, squareFeet: 900 }
    ];

    // Should make only 1 API call
    const rentMap = await rentcastService.getMFPropertyRentEstimates(address, units);
    expect(rentMap.size).toBe(1);
  });
});
```

**Acceptance Criteria**:
- [ ] Integration tests with live API
- [ ] Cache hit rate validation
- [ ] Deduplication validation
- [ ] All tests pass

---

#### **Part B: Property Wizard Enhancement** (52 hours)

##### **Story 3.3: Property Type Selector** (6 hours)
```typescript
// /frontend/src/components/PropertyWizard/PropertyTypeSelector.tsx (NEW)
export const PropertyTypeSelector: React.FC = ({ onSelect }) => {
  return (
    <Box>
      <Typography variant="h5">What type of property are you analyzing?</Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card
            onClick={() => onSelect('SFR')}
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
          >
            <CardContent>
              <HomeIcon fontSize="large" />
              <Typography variant="h6">Single-Family Rental</Typography>
              <Typography variant="body2">
                Houses, condos, townhomes (1 unit)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            onClick={() => onSelect('MF')}
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
          >
            <CardContent>
              <ApartmentIcon fontSize="large" />
              <Typography variant="h6">Multi-Family</Typography>
              <Typography variant="body2">
                Duplexes, triplexes, 4-plexes, apartments (2-32 units)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] Both property types displayed
- [ ] Click handlers work
- [ ] Responsive design
- [ ] Apple-quality UI

---

##### **Story 3.4: MFAddressStep Component** (8 hours)
```typescript
// /frontend/src/components/PropertyWizard/steps/MFAddressStep.tsx (NEW)
export const MFAddressStep: React.FC = ({ data, onUpdate }) => {
  return (
    <Box>
      <Typography variant="h6">Property Address & Details</Typography>

      {/* Address Input (same as SFR) */}
      <TextField
        label="Property Address"
        value={data.address}
        onChange={(e) => onUpdate({ ...data, address: e.target.value })}
        fullWidth
      />

      {/* MF-Specific Fields */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6}>
          <TextField
            label="Total Units"
            type="number"
            value={data.totalUnits}
            onChange={(e) => onUpdate({ ...data, totalUnits: +e.target.value })}
            inputProps={{ min: 2, max: 32 }}
            helperText="2-32 units"
            fullWidth
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Building Square Footage"
            type="number"
            value={data.totalSqft}
            fullWidth
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Year Built"
            type="number"
            value={data.yearBuilt}
            fullWidth
          />
        </Grid>

        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Building Type</InputLabel>
            <Select
              value={data.buildingType}
              onChange={(e) => onUpdate({ ...data, buildingType: e.target.value })}
            >
              <MenuItem value="SIDE_BY_SIDE">Side-by-Side Duplex</MenuItem>
              <MenuItem value="STACKED">Stacked (Up/Down)</MenuItem>
              <MenuItem value="MIXED">Mixed Configuration</MenuItem>
              <MenuItem value="COMPLEX">Multi-Building Complex</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] All MF fields captured
- [ ] Validation (2-32 units)
- [ ] Smart defaults
- [ ] Responsive design

---

##### **Story 3.5: MFUnitMixStep Component** (16 hours - LARGEST COMPONENT)
```typescript
// /frontend/src/components/PropertyWizard/steps/MFUnitMixStep.tsx (NEW)
export const MFUnitMixStep: React.FC = ({ totalUnits, units, onUpdate }) => {
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [template, setTemplate] = useState({
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 900,
    rent: 1500
  });

  const [fetchingRents, setFetchingRents] = useState(false);

  const applyTemplate = () => {
    const templateUnits = Array.from({ length: totalUnits }, (_, i) => ({
      unitNumber: `Unit ${i + 1}`,
      bedrooms: template.bedrooms,
      bathrooms: template.bathrooms,
      squareFeet: template.squareFeet,
      currentRent: template.rent,
      isVacant: false,
      condition: 'GOOD'
    }));

    onUpdate(templateUnits);
  };

  const fetchMarketRents = async () => {
    setFetchingRents(true);
    try {
      // Call backend API to get RentCast estimates
      const response = await api.post('/api/rentcast/mf-estimates', {
        address: data.address,
        units: units.map(u => ({
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          squareFeet: u.squareFeet
        }))
      });

      // Update units with market rents
      const updatedUnits = units.map((unit, index) => ({
        ...unit,
        marketRent: response.data.estimates[index].rent
      }));

      onUpdate(updatedUnits);
    } catch (error) {
      console.error('Failed to fetch market rents:', error);
    } finally {
      setFetchingRents(false);
    }
  };

  if (mode === 'template') {
    return (
      <Box>
        <Typography variant="h6">Quick Setup - Identical Units</Typography>
        <Typography variant="body2" color="text.secondary">
          All {totalUnits} units have the same configuration
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <TextField
              label="Bedrooms"
              type="number"
              value={template.bedrooms}
              onChange={(e) => setTemplate({ ...template, bedrooms: +e.target.value })}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="Bathrooms"
              type="number"
              value={template.bathrooms}
              onChange={(e) => setTemplate({ ...template, bathrooms: +e.target.value })}
              inputProps={{ step: 0.5 }}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="Square Feet"
              type="number"
              value={template.squareFeet}
              onChange={(e) => setTemplate({ ...template, squareFeet: +e.target.value })}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="Monthly Rent"
              type="number"
              value={template.rent}
              onChange={(e) => setTemplate({ ...template, rent: +e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
              fullWidth
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={applyTemplate}
          >
            Apply to All {totalUnits} Units
          </Button>

          <Button
            variant="outlined"
            onClick={() => setMode('custom')}
          >
            Customize Individual Units
          </Button>
        </Box>
      </Box>
    );
  }

  // Custom mode
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Unit Configuration</Typography>
        <Button
          variant="outlined"
          onClick={fetchMarketRents}
          disabled={fetchingRents}
          startIcon={<RefreshIcon />}
        >
          {fetchingRents ? 'Fetching...' : 'Get Market Rents'}
        </Button>
      </Box>

      <UnitMixTable
        units={units}
        onUpdate={onUpdate}
      />

      <Button
        variant="text"
        onClick={() => setMode('template')}
        sx={{ mt: 2 }}
      >
        ← Back to Template Mode
      </Button>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] Template mode works (identical units)
- [ ] Custom mode works (unit-by-unit)
- [ ] RentCast auto-population
- [ ] Unit validation (total matches)
- [ ] Copy unit functionality
- [ ] Responsive design

---

##### **Story 3.6: UnitMixTable Component** (10 hours)
```typescript
// /frontend/src/components/PropertyWizard/steps/UnitMixTable.tsx (NEW)
export const UnitMixTable: React.FC = ({ units, onUpdate }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Unit</TableCell>
            <TableCell>Bedrooms</TableCell>
            <TableCell>Bathrooms</TableCell>
            <TableCell>Sqft</TableCell>
            <TableCell>Current Rent</TableCell>
            <TableCell>Market Rent</TableCell>
            <TableCell>Vacant</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit, index) => (
            <TableRow key={index}>
              <TableCell>
                <TextField
                  value={unit.unitNumber}
                  onChange={(e) => updateUnit(index, 'unitNumber', e.target.value)}
                  size="small"
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  value={unit.bedrooms}
                  onChange={(e) => updateUnit(index, 'bedrooms', +e.target.value)}
                  size="small"
                  sx={{ width: 80 }}
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  value={unit.bathrooms}
                  onChange={(e) => updateUnit(index, 'bathrooms', +e.target.value)}
                  size="small"
                  sx={{ width: 80 }}
                  inputProps={{ step: 0.5 }}
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  value={unit.squareFeet}
                  onChange={(e) => updateUnit(index, 'squareFeet', +e.target.value)}
                  size="small"
                  sx={{ width: 100 }}
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  value={unit.currentRent}
                  onChange={(e) => updateUnit(index, 'currentRent', +e.target.value)}
                  size="small"
                  sx={{ width: 100 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </TableCell>

              <TableCell>
                <Chip
                  label={unit.marketRent ? `$${unit.marketRent}` : 'N/A'}
                  color={unit.currentRent < (unit.marketRent || 0) ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>

              <TableCell>
                <Checkbox
                  checked={unit.isVacant}
                  onChange={(e) => updateUnit(index, 'isVacant', e.target.checked)}
                />
              </TableCell>

              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => copyUnit(index)}
                  title="Copy Unit"
                >
                  <ContentCopyIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

**Acceptance Criteria**:
- [ ] Editable table
- [ ] Copy unit functionality
- [ ] Market rent comparison
- [ ] Validation (rent > 0, sqft > 0)
- [ ] Responsive on mobile

---

##### **Story 3.7: MFFinancingStep Component** (6 hours)
```typescript
// /frontend/src/components/PropertyWizard/steps/MFFinancingStep.tsx (NEW)
export const MFFinancingStep: React.FC = ({ data, onUpdate }) => {
  const isCommercial = data.totalUnits >= 5;

  return (
    <Box>
      <Typography variant="h6">Financing</Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Purchase Price"
            type="number"
            value={data.purchasePrice}
            onChange={(e) => onUpdate({ ...data, purchasePrice: +e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Down Payment"
            type="number"
            value={data.downPayment}
            onChange={(e) => onUpdate({ ...data, downPayment: +e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              endAdornment: <InputAdornment position="end">
                {((data.downPayment / data.purchasePrice) * 100).toFixed(1)}%
              </InputAdornment>
            }}
            helperText={isCommercial ? "Minimum 20-25% for commercial" : "Minimum 15-20%"}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Loan Type</InputLabel>
            <Select
              value={data.loanType}
              onChange={(e) => onUpdate({ ...data, loanType: e.target.value })}
            >
              {!isCommercial && (
                <>
                  <MenuItem value="RESIDENTIAL">Conventional (30-year)</MenuItem>
                  <MenuItem value="FHA">FHA (3.5% down)</MenuItem>
                </>
              )}
              {isCommercial && (
                <>
                  <MenuItem value="COMMERCIAL">Commercial (20-year)</MenuItem>
                  <MenuItem value="COMMERCIAL_ARM">Commercial ARM (5/1, 7/1)</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Interest Rate"
            type="number"
            value={data.interestRate}
            onChange={(e) => onUpdate({ ...data, interestRate: +e.target.value })}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
            helperText={isCommercial ? "Commercial: +0.5-1% vs residential" : "Current market rate"}
            fullWidth
          />
        </Grid>

        {isCommercial && (
          <Grid item xs={12}>
            <Alert severity="info">
              <AlertTitle>Commercial Loan Terms</AlertTitle>
              Commercial loans (5+ units) typically have:
              <ul>
                <li>20-25% down payment minimum</li>
                <li>20-year amortization (vs 30-year residential)</li>
                <li>Balloon payment after 5-7 years</li>
                <li>Interest rate 0.5-1% higher than residential</li>
              </ul>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] Residential vs commercial loan types
- [ ] Smart defaults based on unit count
- [ ] Down payment percentage display
- [ ] Validation (down payment > minimum)
- [ ] Educational tooltips

---

##### **Story 3.8: MFExpensesStep Component** (6 hours)
```typescript
// /frontend/src/components/PropertyWizard/steps/MFExpensesStep.tsx (NEW)
export const MFExpensesStep: React.FC = ({ data, onUpdate }) => {
  return (
    <Box>
      <Typography variant="h6">Operating Expenses</Typography>

      {/* Common Area Utilities */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Common Area Utilities (Landlord-Paid)" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <TextField
                label="Electric (Monthly)"
                type="number"
                value={data.commonAreaUtilities.electric}
                onChange={(e) => updateUtilities('electric', +e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Water (Monthly)"
                type="number"
                value={data.commonAreaUtilities.water}
                onChange={(e) => updateUtilities('water', +e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Gas (Monthly)"
                type="number"
                value={data.commonAreaUtilities.gas}
                onChange={(e) => updateUtilities('gas', +e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Trash (Monthly)"
                type="number"
                value={data.commonAreaUtilities.trash}
                onChange={(e) => updateUtilities('trash', +e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Maintenance & Management" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Maintenance Per Unit (Monthly)"
                type="number"
                value={data.maintenanceCostPerUnit}
                onChange={(e) => onUpdate({ ...data, maintenanceCostPerUnit: +e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Typical: $100-200/unit/month"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Property Management Rate"
                type="number"
                value={data.propertyManagementRate}
                onChange={(e) => onUpdate({ ...data, propertyManagementRate: +e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">% of rent</InputAdornment>
                }}
                helperText="Typical: 8-12% for MF"
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Taxes & Insurance */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Taxes & Insurance" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Property Tax Rate"
                type="number"
                value={data.propertyTaxRate}
                onChange={(e) => onUpdate({ ...data, propertyTaxRate: +e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">% of value</InputAdornment>
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Insurance Rate"
                type="number"
                value={data.insuranceRate}
                onChange={(e) => onUpdate({ ...data, insuranceRate: +e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">% of value</InputAdornment>
                }}
                helperText="Typical: 0.5-0.8% for MF (commercial policy)"
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] All MF expense categories
- [ ] Smart defaults
- [ ] Validation (rates 0-100%)
- [ ] Educational helper text
- [ ] Responsive cards

---

### **Sprint 3 Deliverables**:
- [x] RentCast MF integration (unit-level estimates)
- [x] Property Type Selector
- [x] MF Address Step
- [x] MF Unit Mix Step (template + custom)
- [x] MF Financing Step (residential + commercial)
- [x] MF Expenses Step
- [x] Component tests

### **Sprint 3 Definition of Done**:
- [ ] All wizard steps functional
- [ ] RentCast integration tested
- [ ] E2E test: Complete wizard flow
- [ ] Mobile responsive
- [ ] Component tests: 80%+ coverage
- [ ] Code review completed

---

## 🏃 **SPRINT 4: MF DECISION ENGINE + RESULTS DISPLAY**

**Weeks**: 7-8
**Total Hours**: 60 hours
**Goal**: Build MFDecisionEngine + Display MF results

### **Epic**: Multi-Family Investment Decisions & Results Display

#### **Part A: MF Decision Engine** (26 hours)

##### **Story 4.1: Create MFDecisionEngine** (20 hours)
```typescript
// /backend/src/services/investment/mfDecisionEngine.ts (NEW)
export class MFDecisionEngine extends BaseDecisionEngine<MultiFamilyData, MultiFamilyMetrics> {

  protected getScoringWeights(): ProfessionalWeights {
    return {
      cashFlow: 0.20,      // Lower than SFR (NOI matters more)
      irr: 0.20,
      capRate: 0.25,       // 🎯 PRIMARY MF METRIC (vs 3% for SFR)
      dscr: 0.20,          // 🎯 CRITICAL FOR MF (vs 10% for SFR)
      marketStrength: 0.10,
      exitStrategy: 0.03,
      propertyRisk: 0.02
    };
  }

  protected calculateWalkAwayPrice(analysis: any, propertyData: MultiFamilyData): number {
    // Target: 1.35 DSCR + 7% cap rate
    const targetCapRate = 0.07;
    const targetDSCR = 1.35;

    // Max price from cap rate
    const maxPriceFromCapRate = analysis.keyMetrics.noi / targetCapRate;

    // Max price from DSCR
    const annualDebtService = this.calculateAnnualDebtService(propertyData);
    const maxNOIForTargetDSCR = annualDebtService * targetDSCR;
    const maxPriceFromDSCR = this.calculateMaxPriceForNOI(
      maxNOIForTargetDSCR,
      propertyData
    );

    // Use MORE CONSERVATIVE (lower) price
    return Math.min(maxPriceFromCapRate, maxPriceFromDSCR);
  }

  protected assessPropertyFundamentals(analysis: any, propertyData: MultiFamilyData) {
    return {
      propertyType: 'MF',
      totalUnits: propertyData.totalUnits,
      totalSqft: propertyData.totalSqft,
      yearBuilt: propertyData.yearBuilt,
      buildingType: propertyData.buildingType,
      unitMix: this.summarizeUnitMix(propertyData.units),
      averageUnitSize: propertyData.totalSqft / propertyData.totalUnits,
      loanType: propertyData.loanType,
      isCommercialLoan: propertyData.totalUnits >= 5
    };
  }

  protected extractPropertyRisk(propertyData: MultiFamilyData): number {
    // MF-specific risks
    let riskScore = 0;

    // Age risk
    const propertyAge = new Date().getFullYear() - propertyData.yearBuilt;
    if (propertyAge > 50) riskScore += 20;
    else if (propertyAge > 30) riskScore += 10;

    // Unit concentration risk (all same type = higher risk)
    const unitConcentrationRisk = this.calculateUnitConcentrationRisk(propertyData.units);
    riskScore += unitConcentrationRisk;

    // Commercial loan risk (balloon payments)
    if (propertyData.loanType === 'COMMERCIAL' && propertyData.balloonPayment) {
      riskScore += 15;
    }

    // Break-even occupancy risk
    const breakEvenOccupancy = this.calculateBreakEvenOccupancy(propertyData);
    if (breakEvenOccupancy > 85) riskScore += 20;
    else if (breakEvenOccupancy > 75) riskScore += 10;

    // 🎯 POSITIVE: Tenant diversification (reduces risk vs SFR)
    const tenantDiversificationBonus = Math.min(20, propertyData.totalUnits * 2);
    riskScore -= tenantDiversificationBonus;

    return Math.max(0, Math.min(100, riskScore));
  }

  protected generateVerdictLogic(
    dealQuality: number,
    analysis: AnalysisResult<MultiFamilyMetrics>,
    propertyData: MultiFamilyData
  ): InvestmentVerdict {
    const dscr = analysis.keyMetrics.dscr;
    const capRate = analysis.keyMetrics.capRate;

    // MF-specific: More conservative, DSCR is critical
    if (dealQuality >= 80 && dscr >= 1.35) {
      return 'BUY';
    } else if (dealQuality >= 70 && dscr >= 1.25) {
      return 'NEGOTIATE';
    } else if (dealQuality >= 55 || dscr < 1.25) {
      return 'CAUTION';
    } else {
      return 'PASS';
    }
  }
}
```

**Acceptance Criteria**:
- [ ] All abstract methods implemented
- [ ] MF-specific scoring weights
- [ ] Conservative verdict logic (DSCR focus)
- [ ] Walk-away price based on NOI
- [ ] Unit tests (90%+ coverage)

---

##### **Story 4.2: Update Investment Decision Engine Factory** (4 hours)
```typescript
// /backend/src/services/investment/investmentDecisionEngine.ts (UPDATE)
import { MFDecisionEngine } from './mfDecisionEngine';

export class InvestmentDecisionEngine {
  public static async generateDecision<T extends BasePropertyData, U extends CommonMetrics>(
    analysis: AnalysisResult<U>,
    propertyData: T,
    marketData?: MarketDataResponse
  ): Promise<InvestmentDecision> {

    let engine: BaseDecisionEngine<T, U>;

    if (propertyData.propertyType === 'SFR') {
      engine = new SFRDecisionEngine() as unknown as BaseDecisionEngine<T, U>;
    } else if (propertyData.propertyType === 'MF') {
      engine = new MFDecisionEngine() as unknown as BaseDecisionEngine<T, U>;  // ✅ NEW
    } else {
      throw new Error(`Unsupported property type: ${propertyData.propertyType}`);
    }

    return engine.generateDecision(analysis, propertyData, marketData);
  }
}
```

**Acceptance Criteria**:
- [ ] MF routing works
- [ ] SFR still works (no regression)
- [ ] Integration test for both property types

---

##### **Story 4.3: MF Decision Engine Tests** (2 hours)
```typescript
// /backend/src/tests/investment/mfDecisionEngine.test.ts (NEW)
describe('MFDecisionEngine', () => {

  describe('Scoring Weights', () => {
    it('should prioritize cap rate (25%) over cash flow (20%)', () => {
      const weights = engine.getScoringWeights();
      expect(weights.capRate).toBe(0.25);
      expect(weights.cashFlow).toBe(0.20);
    });

    it('should emphasize DSCR (20%) for MF', () => {
      const weights = engine.getScoringWeights();
      expect(weights.dscr).toBe(0.20);
    });
  });

  describe('Verdict Logic', () => {
    it('should return BUY for score 80+ and DSCR 1.35+', () => {
      const verdict = engine.generateVerdict(85, { dscr: 1.40 });
      expect(verdict).toBe('BUY');
    });

    it('should return CAUTION for DSCR < 1.25', () => {
      const verdict = engine.generateVerdict(75, { dscr: 1.20 });
      expect(verdict).toBe('CAUTION');
    });
  });

  describe('Walk-Away Price', () => {
    it('should base on NOI / target cap rate', () => {
      const walkAway = engine.calculateWalkAwayPrice(analysis, propertyData);
      expect(walkAway).toBeLessThan(propertyData.purchasePrice);
    });

    it('should ensure DSCR >= 1.35 at walk-away price', () => {
      // Test that calculated price maintains target DSCR
    });
  });
});
```

**Acceptance Criteria**:
- [ ] 20+ unit tests
- [ ] 90%+ code coverage
- [ ] All tests pass

---

#### **Part B: Results Display** (34 hours)

##### **Story 4.4: Enhance AnalysisResults for MF** (6 hours)
```typescript
// /frontend/src/components/AnalysisResults/AnalysisResults.tsx (UPDATE)
export const AnalysisResults: React.FC = ({ analysis, propertyData }) => {
  const isMF = propertyData.propertyType === 'MF';

  const tabs = isMF ? [
    { label: 'Overview', value: 'overview' },
    { label: 'Unit Mix', value: 'unitMix' },       // 🆕 MF ONLY
    { label: 'Financials', value: 'financials' },
    { label: 'Projections', value: 'projections' },
    { label: 'AI Insights', value: 'aiInsights' }
  ] : [
    { label: 'Overview', value: 'overview' },
    { label: 'Financials', value: 'financials' },
    { label: 'Projections', value: 'projections' },
    { label: 'AI Insights', value: 'aiInsights' }
  ];

  return (
    <Box>
      <InvestmentDecisionHero
        verdict={analysis.investmentDecision.verdict}
        dealQuality={analysis.investmentDecision.professionalAssessment.dealQuality}
        keyMetrics={analysis.keyMetrics}
        propertyType={propertyData.propertyType}  // ✅ Pass for MF-specific display
      />

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
        {tabs.map(tab => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      {/* Conditional Tab Content */}
      {currentTab === 'overview' && <OverviewTab analysis={analysis} propertyData={propertyData} />}
      {currentTab === 'unitMix' && isMF && <UnitMixAnalysisTab analysis={analysis} propertyData={propertyData} />}
      {currentTab === 'financials' && <FinancialsTab analysis={analysis} />}
      {currentTab === 'projections' && <ProjectionsTab analysis={analysis} />}
      {currentTab === 'aiInsights' && <AIInsightsTab analysis={analysis} />}
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] Conditional tab rendering
- [ ] MF Unit Mix tab shows
- [ ] SFR unaffected (no regression)
- [ ] Smooth tab transitions

---

##### **Story 4.5: Enhance InvestmentDecisionHero for MF** (6 hours)
```typescript
// /frontend/src/components/AnalysisResults/InvestmentDecisionHero.tsx (UPDATE)
export const InvestmentDecisionHero: React.FC = ({ verdict, dealQuality, keyMetrics, propertyType }) => {
  const isMF = propertyType === 'MF';

  // MF-specific metrics to highlight
  const primaryMetrics = isMF ? [
    { label: 'Cap Rate', value: `${keyMetrics.capRate.toFixed(2)}%`, icon: <TrendingUpIcon /> },
    { label: 'DSCR', value: keyMetrics.dscr.toFixed(2), icon: <AccountBalanceIcon /> },
    { label: 'NOI', value: formatCurrency(keyMetrics.noi), icon: <AttachMoneyIcon /> },
    { label: 'Cash-on-Cash', value: `${keyMetrics.cashOnCashReturn.toFixed(2)}%`, icon: <PercentIcon /> }
  ] : [
    { label: 'Cash Flow', value: formatCurrency(keyMetrics.monthlyAnalysis.cashFlow), icon: <AttachMoneyIcon /> },
    { label: 'Cash-on-Cash', value: `${keyMetrics.cashOnCashReturn.toFixed(2)}%`, icon: <PercentIcon /> },
    { label: 'Cap Rate', value: `${keyMetrics.capRate.toFixed(2)}%`, icon: <TrendingUpIcon /> },
    { label: 'IRR', value: `${keyMetrics.irr.toFixed(2)}%`, icon: <ShowChartIcon /> }
  ];

  return (
    <Paper sx={{ p: 3, mb: 3, background: getVerdictGradient(verdict) }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="overline">Investment Decision</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {verdict}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Deal Quality: {dealQuality}/100
          </Typography>
        </Box>

        <Box>
          <CircularProgress
            variant="determinate"
            value={dealQuality}
            size={120}
            thickness={5}
          />
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {primaryMetrics.map(metric => (
          <Grid item xs={6} md={3} key={metric.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {metric.icon}
                  <Typography variant="overline">{metric.label}</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {isMF && keyMetrics.dscr < 1.25 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>DSCR Below Lender Minimum</AlertTitle>
          Commercial lenders typically require DSCR ≥ 1.25. Current DSCR of {keyMetrics.dscr.toFixed(2)} may make financing difficult.
        </Alert>
      )}
    </Paper>
  );
};
```

**Acceptance Criteria**:
- [ ] MF shows Cap Rate + DSCR prominence
- [ ] SFR shows Cash Flow + CoC prominence
- [ ] DSCR warning for MF < 1.25
- [ ] Responsive layout

---

##### **Story 4.6: Create UnitMixAnalysisTab** (12 hours - LARGEST COMPONENT)
```typescript
// /frontend/src/components/AnalysisResults/tabs/UnitMixAnalysisTab.tsx (NEW)
export const UnitMixAnalysisTab: React.FC = ({ analysis, propertyData }) => {
  const mfData = propertyData as MultiFamilyData;
  const metrics = analysis.keyMetrics as MultiFamilyMetrics;

  const unitMixSummary = calculateUnitMixSummary(mfData.units);

  return (
    <Box>
      {/* Current Unit Mix Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Current Unit Mix" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Unit Type</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Avg Rent</TableCell>
                  <TableCell align="right">Total Monthly</TableCell>
                  <TableCell align="right">Total Annual</TableCell>
                  <TableCell align="right">% of Income</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unitMixSummary.map(row => (
                  <TableRow key={row.unitType}>
                    <TableCell>{row.unitType}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">{formatCurrency(row.avgRent)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalMonthly)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalAnnual)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${row.percentOfIncome.toFixed(1)}%`}
                        color={row.percentOfIncome > 50 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Concentration Warning */}
          {unitMixSummary.some(row => row.percentOfIncome > 50) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Unit Mix Concentration Risk</AlertTitle>
              Over 50% of your income comes from a single unit type. Consider diversifying your unit mix to reduce vacancy risk.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Per-Unit Economics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Price Per Unit</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {formatCurrency(metrics.pricePerUnit)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mfData.totalUnits} units
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">NOI Per Unit</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {formatCurrency(metrics.noiPerUnit)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(metrics.noiPerUnit / 12)}/month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Avg Rent Per Unit</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {formatCurrency(metrics.averageRentPerUnit)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(metrics.averageRentPerUnit * 12)}/year
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Rent Per Sqft</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                ${metrics.rentPerSqft.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mfData.totalSqft.toLocaleString()} total sqft
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Unit Mix Efficiency Chart */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Unit Mix Revenue Distribution" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={unitMixSummary}
                dataKey="totalAnnual"
                nameKey="unitType"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.unitType}: ${entry.percentOfIncome.toFixed(1)}%`}
              >
                {unitMixSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI-Generated Unit Mix Optimization (if available) */}
      {analysis.aiInsights?.unitMixOptimization && (
        <Card>
          <CardHeader
            title="Unit Mix Optimization Insights"
            subheader="AI-powered recommendations"
            avatar={<AutoAwesomeIcon />}
          />
          <CardContent>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {analysis.aiInsights.unitMixOptimization}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] Unit mix table displays
- [ ] Per-unit metrics cards
- [ ] Revenue distribution chart
- [ ] Concentration warnings
- [ ] AI insights display (if available)
- [ ] Responsive layout

---

##### **Story 4.7: Update FinancialsTab for MF** (6 hours)
```typescript
// /frontend/src/components/AnalysisResults/tabs/FinancialsTab.tsx (UPDATE)
export const FinancialsTab: React.FC = ({ analysis, propertyData }) => {
  const isMF = propertyData?.propertyType === 'MF';

  return (
    <Box>
      {/* Key Metrics Section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Key Financial Metrics" />
        <CardContent>
          <Grid container spacing={2}>
            {/* MF-specific metrics prominence */}
            {isMF && (
              <>
                <Grid item xs={6} md={3}>
                  <MetricCard
                    label="Cap Rate"
                    value={`${analysis.keyMetrics.capRate.toFixed(2)}%`}
                    benchmark="Target: 6-8%"
                    status={analysis.keyMetrics.capRate >= 7 ? 'excellent' : 'good'}
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <MetricCard
                    label="DSCR"
                    value={analysis.keyMetrics.dscr.toFixed(2)}
                    benchmark="Lender Min: 1.25"
                    status={analysis.keyMetrics.dscr >= 1.35 ? 'excellent' :
                           analysis.keyMetrics.dscr >= 1.25 ? 'good' : 'warning'}
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <MetricCard
                    label="Break-Even Occupancy"
                    value={`${analysis.keyMetrics.breakEvenOccupancy.toFixed(1)}%`}
                    benchmark="Target: <85%"
                    status={analysis.keyMetrics.breakEvenOccupancy < 75 ? 'excellent' :
                           analysis.keyMetrics.breakEvenOccupancy < 85 ? 'good' : 'warning'}
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <MetricCard
                    label="Operating Expense Ratio"
                    value={`${analysis.keyMetrics.operatingExpenseRatio.toFixed(1)}%`}
                    benchmark="Target: 35-45%"
                    status={analysis.keyMetrics.operatingExpenseRatio <= 45 ? 'good' : 'warning'}
                  />
                </Grid>
              </>
            )}

            {/* Standard metrics for both */}
            <Grid item xs={6} md={3}>
              <MetricCard
                label="Cash-on-Cash Return"
                value={`${analysis.keyMetrics.cashOnCashReturn.toFixed(2)}%`}
                benchmark="Target: 10%+"
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <MetricCard
                label="IRR"
                value={`${analysis.keyMetrics.irr.toFixed(2)}%`}
                benchmark="Target: 12%+"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ... rest of financials tab ... */}
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] MF metrics prominent (Cap Rate, DSCR, OER, Break-even)
- [ ] SFR metrics unchanged
- [ ] Benchmarks contextual
- [ ] Visual status indicators

---

##### **Story 4.8: Component Tests** (4 hours)
```typescript
// /frontend/src/components/AnalysisResults/__tests__/UnitMixAnalysisTab.test.tsx
describe('UnitMixAnalysisTab', () => {
  it('should render unit mix summary table', () => {});
  it('should show per-unit metrics', () => {});
  it('should display concentration warning if >50%', () => {});
  it('should render revenue distribution chart', () => {});
  it('should show AI insights if available', () => {});
});
```

**Acceptance Criteria**:
- [ ] Component tests for all new MF components
- [ ] 80%+ coverage
- [ ] Snapshot tests for UI consistency

---

### **Sprint 4 Deliverables**:
- [x] MFDecisionEngine implemented
- [x] MF verdict logic (DSCR-focused)
- [x] MF walk-away price calculation
- [x] UnitMixAnalysisTab component
- [x] MF-specific results display
- [x] Enhanced InvestmentDecisionHero

### **Sprint 4 Definition of Done**:
- [ ] MF analysis generates verdicts
- [ ] Results display MF-specific insights
- [ ] All component tests pass
- [ ] Integration test: Full MF flow (wizard → analysis → results)
- [ ] Visual regression tests
- [ ] Code review completed

---

## 🏃 **SPRINT 5: AI ENHANCEMENT + PORTFOLIO INTEGRATION**

**Weeks**: 9-10
**Total Hours**: 40 hours
**Goal**: Add AI-powered MF insights + Portfolio intelligence

### **Epic**: AI-Enhanced Multi-Family Intelligence

#### **Stories**:

##### **Story 5.1: MF AI Prompts & Content Generation** (16 hours)
```typescript
// /backend/src/services/aiService.ts (ENHANCE)

export async function generateMFUnitMixInsights(
  analysis: AnalysisResult<MultiFamilyMetrics>,
  propertyData: MultiFamilyData,
  marketData?: MarketDataResponse
): Promise<string> {

  const unitMixBreakdown = propertyData.units.reduce((acc, unit) => {
    const key = `${unit.bedrooms}BR/${unit.bathrooms}BA`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `You are a multi-family investment analyst with 15 years managing 500+ units.

Property: ${propertyData.totalUnits}-unit building in ${propertyData.propertyAddress.city}, ${propertyData.propertyAddress.state}
Year Built: ${propertyData.yearBuilt}
Total Units: ${propertyData.totalUnits}

Current Unit Mix:
${Object.entries(unitMixBreakdown).map(([type, count]) => `- ${count}× ${type}`).join('\n')}

Financial Performance:
- Cap Rate: ${analysis.keyMetrics.capRate.toFixed(2)}%
- DSCR: ${analysis.keyMetrics.dscr.toFixed(2)}
- NOI Per Unit: $${analysis.keyMetrics.noiPerUnit.toFixed(0)}/year
- Operating Expense Ratio: ${analysis.keyMetrics.operatingExpenseRatio.toFixed(1)}%
- Break-Even Occupancy: ${analysis.keyMetrics.breakEvenOccupancy.toFixed(1)}%

Market Context:
${marketData ? formatMarketContext(marketData) : 'Limited market data available'}

Analyze:
1. Is this unit mix optimal for this market? Consider local demographics and demand.
2. What's the opportunity cost of the current mix vs optimal?
3. Specific unit conversion recommendations with ROI projections.
4. Vacancy risk assessment based on unit type concentration.
5. Value-add strategies to increase NOI by 15-25%.

Be specific with $ amounts and ROI calculations. Format as investor-ready recommendations.
Limit to 300 words.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 600
  });

  return response.choices[0].message.content || 'Analysis unavailable';
}

export async function generateMFStrategicActionPlan(
  analysis: AnalysisResult<MultiFamilyMetrics>,
  propertyData: MultiFamilyData,
  verdict: InvestmentVerdict
): Promise<string> {

  const dscr = analysis.keyMetrics.dscr;
  const capRate = analysis.keyMetrics.capRate;

  const prompt = `Generate a strategic action plan for this ${propertyData.totalUnits}-unit multi-family investment.

Verdict: ${verdict}
Key Metrics:
- Cap Rate: ${capRate.toFixed(2)}%
- DSCR: ${dscr.toFixed(2)}
- Break-Even Occupancy: ${analysis.keyMetrics.breakEvenOccupancy.toFixed(1)}%

${verdict === 'BUY' ?
  'Create an action plan to maximize this strong opportunity.' :
  'Create an action plan to improve deal terms or mitigate risks.'}

Include:
1. Immediate actions (30 days)
2. Short-term priorities (90 days)
3. Long-term strategy (1+ years)

Focus on MF-specific strategies: rent optimization, expense reduction, occupancy management, unit conversions.
Limit to 250 words.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500
  });

  return response.choices[0].message.content || 'Action plan unavailable';
}
```

**Acceptance Criteria**:
- [ ] MF-specific AI prompts
- [ ] Unit mix optimization insights
- [ ] Strategic action plans
- [ ] 300-600 word responses
- [ ] Integration tests with OpenAI API

---

##### **Story 5.2: Portfolio Intelligence MF Enhancement** (10 hours)
```typescript
// /backend/src/services/portfolio/enhancedPortfolioAI.ts (ENHANCE)

async generateMFPortfolioInsights(portfolio: any, analytics: any): Promise<string> {
  const mfProperties = portfolio.properties.filter(p => p.propertyType === 'MF');

  if (mfProperties.length === 0) return '';

  const totalMFUnits = mfProperties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
  const avgCapRate = mfProperties.reduce((sum, p) => sum + (p.analysis?.keyMetrics?.capRate || 0), 0) / mfProperties.length;
  const avgDSCR = mfProperties.reduce((sum, p) => sum + (p.analysis?.keyMetrics?.dscr || 0), 0) / mfProperties.length;

  return `
    Multi-Family Portfolio Insights:

    Properties: ${mfProperties.length} MF buildings (${totalMFUnits} total units)
    Avg Cap Rate: ${avgCapRate.toFixed(2)}%
    Avg DSCR: ${avgDSCR.toFixed(2)}

    Tenant Diversification: ${totalMFUnits} tenants across ${mfProperties.length} buildings reduces single-tenant risk by ${((1 - 1/totalMFUnits) * 100).toFixed(0)}%

    ${avgDSCR < 1.25 ?
      '⚠️ Warning: Portfolio-wide DSCR below lender minimum. Consider refinancing or selling underperforming properties.' :
      '✅ Strong DSCR across portfolio provides refinancing opportunities.'}

    Recommendation: ${generateMFPortfolioRecommendation(mfProperties, analytics)}
  `;
}
```

**Acceptance Criteria**:
- [ ] MF-specific portfolio insights
- [ ] Tenant diversification analysis
- [ ] DSCR portfolio-wide assessment
- [ ] Integration with existing portfolio AI

---

##### **Story 5.3: AI Content Integration Tests** (6 hours)
```typescript
// /backend/src/tests/integration/ai-mf-content.test.ts
describe('MF AI Content Generation', () => {
  it('should generate unit mix optimization insights', async () => {
    const insights = await generateMFUnitMixInsights(analysis, propertyData);
    expect(insights).toContain('unit mix');
    expect(insights.length).toBeGreaterThan(100);
  });

  it('should generate strategic action plan', async () => {
    const plan = await generateMFStrategicActionPlan(analysis, propertyData, 'BUY');
    expect(plan).toContain('action');
    expect(plan.length).toBeGreaterThan(100);
  });

  it('should handle BUY vs PASS verdicts differently', async () => {
    const buyPlan = await generateMFStrategicActionPlan(analysis, propertyData, 'BUY');
    const passPlan = await generateMFStrategicActionPlan(analysis, propertyData, 'PASS');
    expect(buyPlan).not.toBe(passPlan);
  });
});
```

**Acceptance Criteria**:
- [ ] Integration tests with OpenAI
- [ ] Content quality validation
- [ ] Error handling for API failures

---

##### **Story 5.4: AI Insights Display in Frontend** (8 hours)
```typescript
// /frontend/src/components/AnalysisResults/tabs/AIInsightsTab.tsx (UPDATE)
export const AIInsightsTab: React.FC = ({ analysis, propertyData }) => {
  const isMF = propertyData.propertyType === 'MF';

  return (
    <Box>
      {isMF && analysis.aiInsights?.unitMixOptimization && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Unit Mix Optimization"
            subheader="AI-powered recommendations for maximizing NOI"
            avatar={<AutoAwesomeIcon />}
          />
          <CardContent>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {analysis.aiInsights.unitMixOptimization}
            </Typography>
          </CardContent>
        </Card>
      )}

      {analysis.aiInsights?.strategicActionPlan && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Strategic Action Plan"
            subheader={isMF ? "Multi-family execution strategy" : "Investment strategy"}
            avatar={<TimelineIcon />}
          />
          <CardContent>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {analysis.aiInsights.strategicActionPlan}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ... rest of AI insights ... */}
    </Box>
  );
};
```

**Acceptance Criteria**:
- [ ] MF-specific AI content displayed
- [ ] Proper formatting (white-space preserved)
- [ ] Loading states
- [ ] Error states (if AI fails)

---

### **Sprint 5 Deliverables**:
- [x] MF AI prompts (unit mix optimization, strategic plans)
- [x] Portfolio intelligence MF enhancements
- [x] AI insights display in frontend
- [x] Integration tests

### **Sprint 5 Definition of Done**:
- [ ] AI content generates for MF
- [ ] Portfolio insights include MF context
- [ ] All AI integration tests pass
- [ ] Content quality validated by user
- [ ] Error handling for API failures

---

## 🏃 **SPRINT 6: TESTING + INTEGRATION**

**Weeks**: 11-12
**Total Hours**: 52 hours
**Goal**: Comprehensive testing, bug fixes, beta preparation

### **Epic**: Quality Assurance & Production Readiness

#### **Stories**:

##### **Story 6.1: Integration Testing** (16 hours)
```typescript
// /backend/src/tests/integration/mf-full-flow.test.ts
describe('MF Full Analysis Flow', () => {

  it('should complete 2-unit duplex analysis', async () => {
    const propertyData: MultiFamilyData = {
      propertyType: 'MF',
      totalUnits: 2,
      units: [
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1500 },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1500 }
      ],
      // ... rest of data
    };

    // Test analyzer
    const analyzer = new MultiFamilyAnalyzer(propertyData, assumptions);
    const analysis = await analyzer.analyzeWithMarketIntelligence();

    expect(analysis.keyMetrics.noi).toBeGreaterThan(0);
    expect(analysis.keyMetrics.capRate).toBeGreaterThan(0);
    expect(analysis.keyMetrics.dscr).toBeGreaterThan(0);

    // Test decision engine
    const decision = await InvestmentDecisionEngine.generateDecision(
      analysis,
      propertyData
    );

    expect(decision.verdict).toMatch(/BUY|NEGOTIATE|CAUTION|PASS/);
    expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(0);
    expect(decision.professionalAssessment.dealQuality).toBeLessThanOrEqual(100);
  });

  it('should complete 8-unit building analysis with mixed units', async () => {
    // Test with 4× 1BR, 4× 2BR
  });

  it('should complete 32-unit complex analysis', async () => {
    // Test upper limit
  });

  it('should match manual spreadsheet calculations (95%+ accuracy)', async () => {
    // Load known property data
    // Compare analyzer results to manual spreadsheet
    // Allow 5% variance for rounding differences
  });
});
```

**Acceptance Criteria**:
- [ ] 4 MF test scenarios (2-unit, 4-unit, 8-unit, 32-unit)
- [ ] Manual calculation validation (95%+ accuracy)
- [ ] All integration tests pass
- [ ] Performance benchmarks (<200ms)

---

##### **Story 6.2: E2E Testing (Cypress)** (12 hours)
```javascript
// /cypress/e2e/mf-property-wizard.cy.js
describe('MF Property Wizard Flow', () => {

  it('should complete full MF wizard for 4-unit property', () => {
    cy.visit('/analyze');

    // Step 0: Property Type Selector
    cy.contains('Multi-Family').click();

    // Step 1: Address & Details
    cy.get('input[name="address"]').type('4512 Sycamore St, Dallas, TX 75204');
    cy.get('input[name="totalUnits"]').clear().type('4');
    cy.get('input[name="totalSqft"]').type('3600');
    cy.get('input[name="yearBuilt"]').type('1923');
    cy.contains('Next').click();

    // Step 2: Unit Mix (Template Mode)
    cy.get('input[name="bedrooms"]').clear().type('2');
    cy.get('input[name="bathrooms"]').clear().type('1');
    cy.get('input[name="squareFeet"]').clear().type('900');
    cy.get('input[name="rent"]').clear().type('1500');
    cy.contains('Apply to All 4 Units').click();
    cy.contains('Next').click();

    // Step 3: Financing
    cy.get('input[name="purchasePrice"]').type('520000');
    cy.get('input[name="downPayment"]').type('104000'); // 20%
    cy.get('input[name="interestRate"]').clear().type('6.5');
    cy.contains('Next').click();

    // Step 4: Expenses
    cy.get('input[name="electric"]').type('150');
    cy.get('input[name="water"]').type('100');
    cy.get('input[name="maintenanceCostPerUnit"]').type('150');
    cy.get('input[name="propertyManagementRate"]').clear().type('10');
    cy.contains('Next').click();

    // Step 5: Assumptions (use defaults)
    cy.contains('Next').click();

    // Step 6: Analyze
    cy.contains('Analyze Property').click();

    // Wait for results
    cy.contains('Investment Decision', { timeout: 10000 });
    cy.contains(/BUY|NEGOTIATE|CAUTION|PASS/);

    // Verify MF-specific content
    cy.contains('Cap Rate');
    cy.contains('DSCR');
    cy.contains('Unit Mix'); // MF-specific tab

    // Click Unit Mix tab
    cy.contains('Unit Mix').click();
    cy.contains('Current Unit Mix');
    cy.contains('NOI Per Unit');
  });

  it('should allow custom unit configuration', () => {
    // Test custom mode with different unit types
  });

  it('should fetch RentCast market rents', () => {
    // Test RentCast auto-population
  });
});
```

**Acceptance Criteria**:
- [ ] Full wizard flow E2E test
- [ ] Custom unit configuration test
- [ ] RentCast integration test
- [ ] All E2E tests pass
- [ ] Screenshot documentation

---

##### **Story 6.3: Performance Testing** (4 hours)
```typescript
// /backend/src/tests/performance/mf-analysis-performance.test.ts
describe('MF Analysis Performance', () => {

  it('should complete analysis in <200ms', async () => {
    const start = Date.now();
    const analysis = await analyzer.analyze();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });

  it('should handle 32-unit property without timeout', async () => {
    const largeProperty: MultiFamilyData = {
      // ... 32 units
    };

    const start = Date.now();
    const analysis = await analyzer.analyze();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500); // Allow 500ms for large property
  });

  it('should cache RentCast results effectively', async () => {
    // First call (no cache)
    const start1 = Date.now();
    await rentcastService.getMFUnitRentEstimate(params);
    const duration1 = Date.now() - start1;

    // Second call (cached)
    const start2 = Date.now();
    await rentcastService.getMFUnitRentEstimate(params);
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(duration1 * 0.1); // 90% faster with cache
  });
});
```

**Acceptance Criteria**:
- [ ] Analysis <200ms
- [ ] Large properties <500ms
- [ ] Caching 90%+ effective
- [ ] No memory leaks

---

##### **Story 6.4: Beta User Testing** (8 hours)
**Tasks**:
1. Select 10 beta users (BiggerPockets power users)
2. Provide beta access credentials
3. Ask them to analyze 3-5 MF properties
4. Collect feedback via survey
5. Schedule 30-minute feedback calls with 3 users

**Feedback Questions**:
- Was the Property Wizard easy to use?
- Were the results helpful and accurate?
- Did the Investment Decision make sense?
- What features are missing?
- Would you pay $49/month for this?

**Acceptance Criteria**:
- [ ] 10 beta users recruited
- [ ] 30+ MF analyses completed by beta users
- [ ] Feedback collected and documented
- [ ] Critical bugs identified and prioritized

---

##### **Story 6.5: Bug Fixes & Polish** (12 hours)
**Tasks**:
1. Fix P0 bugs from beta testing
2. Fix P1 bugs from beta testing
3. UI polish (spacing, alignment, colors)
4. Mobile responsive fixes
5. Error message improvements
6. Loading state improvements

**Acceptance Criteria**:
- [ ] All P0 bugs fixed
- [ ] 80% of P1 bugs fixed
- [ ] UI polish complete
- [ ] Mobile testing passed
- [ ] No critical regressions

---

### **Sprint 6 Deliverables**:
- [x] 4 MF integration tests
- [x] E2E wizard flow test
- [x] Performance benchmarks
- [x] Beta user feedback
- [x] Bug fixes and polish
- [x] Production-ready code

### **Sprint 6 Definition of Done**:
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Beta feedback incorporated
- [ ] P0/P1 bugs fixed
- [ ] Ready for public launch

---

## 📦 **BUFFER WEEK (WEEK 13)**

**Total Hours**: 32 hours
**Goal**: Final polish, documentation, deployment preparation

### **Tasks**:

#### **1. Documentation** (8 hours)
- [ ] Update ARCHITECTURE_V3.md with base class pattern
- [ ] Update DATA_DICTIONARY.md with MF fields
- [ ] Create MF_USER_GUIDE.md for users
- [ ] Update API.md with MF endpoints
- [ ] Create CHANGELOG.md entry for MF launch

#### **2. Final Testing** (8 hours)
- [ ] Regression testing (ensure SFR unaffected)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS, Android)
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Security audit (input validation, SQL injection, XSS)

#### **3. Deployment Preparation** (8 hours)
- [ ] Feature flag setup (enable for beta users first)
- [ ] Database migration scripts (if needed)
- [ ] Environment variables configuration
- [ ] Monitoring/logging setup for MF endpoints
- [ ] Rollback plan documentation

#### **4. Marketing Preparation** (8 hours)
- [ ] Create demo video (5 minutes)
- [ ] Write launch announcement (BiggerPockets, Reddit)
- [ ] Prepare case studies (3 example MF analyses)
- [ ] Update REAnalyzr.com landing page
- [ ] Create email campaign for existing users

---

## 📊 **SPRINT METRICS & TRACKING**

### **Weekly Standup Format**:
```
Monday Standup:
- What was completed last week?
- What's the focus this week?
- Any blockers?
- Sprint goal on track?

Friday Review:
- Sprint progress (% complete)
- Test pass rate
- Bugs found/fixed
- Weekend work needed?
```

### **Key Performance Indicators**:
```
Code Quality:
- Unit test coverage: >90%
- Integration test coverage: >80%
- E2E test pass rate: 100%
- Code review approval: Required

Performance:
- Backend response time: <200ms
- Frontend render time: <100ms
- RentCast cache hit rate: >85%

User Experience:
- Wizard completion rate: >90%
- Beta user satisfaction: >85%
- Mobile usability score: >80/100
```

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Success**:
- [ ] All 6 sprints completed
- [ ] 350+ unit tests passing
- [ ] 20+ integration tests passing
- [ ] 10+ E2E tests passing
- [ ] Performance benchmarks met
- [ ] Zero P0 bugs in production

### **User Success**:
- [ ] 50+ MF analyses in first month
- [ ] 30% MF adoption (users with 3+ properties)
- [ ] 85%+ user satisfaction
- [ ] <5% wizard abandonment rate

### **Business Success**:
- [ ] Feature flag enabled for public
- [ ] Marketing materials ready
- [ ] Beta user testimonials collected
- [ ] Competitive differentiation validated

---

## 📋 **RISK REGISTER**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **SFR Regression** | Medium | High | Comprehensive regression tests, feature flags |
| **Investment Engine Refactor Bugs** | Medium | High | Extensive unit tests, parallel old/new comparison |
| **RentCast API Issues** | Low | Medium | Fallback to Census data, error handling |
| **Beta User Negative Feedback** | Low | Medium | Rapid iteration, priority bug fixes |
| **Timeline Overrun** | Medium | Medium | Buffer week, sprint scope flexibility |
| **Mobile UX Issues** | Medium | Low | Early mobile testing, responsive design reviews |

---

## ✅ **READY TO START**

**Prerequisites**:
- [x] All planning documents approved
- [x] RentCast API validated (100%)
- [x] Existing SFR codebase understood
- [x] GitHub project board created (next step)
- [ ] Feature branch created: `feature/mf-analysis-v1`
- [ ] Kick-off meeting scheduled

**Next Actions**:
1. Create feature branch
2. Create GitHub issues for Sprint 1 stories
3. Start Story 1.1: Create BaseDecisionEngine

---

**Sprint Plan Created**: October 24, 2025
**Status**: ✅ **READY TO EXECUTE**
**Total Duration**: 13 weeks
**Total Effort**: 352 hours

Let's build this right! 🚀
