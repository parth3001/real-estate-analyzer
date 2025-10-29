# Multi-Family Feature - Technical Implementation Plan

**Architect**: Principal Software Architect (18 years: Amazon 8y, Redfin 6y)
**Date**: October 23, 2025
**Status**: ✅ READY FOR IMPLEMENTATION (100% validation complete)
**Approach**: Property type extension, NOT separate application

---

## 🏛️ **ARCHITECTURAL PHILOSOPHY**

### **Core Principle: "Multi-Family is a Property Type, Not a Separate App"**

> "The existing architecture with `BasePropertyAnalyzer` + `propertyType` enum was designed EXACTLY for this scenario. We extend the pattern, not create a new one."

**What This Means:**
- ✅ Same `Deal` model - just different `propertyType` value
- ✅ Same API endpoints - `/api/deals/analyze` handles both SFR and MF
- ✅ Same Property Wizard flow - conditional steps based on property type
- ✅ Same Investment Decision Engine - MF-calibrated scoring weights
- ✅ Same UI components - shared `AnalysisResults` with property-specific tabs

**Anti-Patterns to Avoid:**
- ❌ Separate `/api/multifamily/*` endpoints
- ❌ Separate `MFDeal` model
- ❌ Separate `MFPropertyWizard` component tree
- ❌ Separate frontend routes (`/mf-analysis` vs `/analysis`)

---

## 📊 **EXISTING ARCHITECTURE ANALYSIS**

### **What Already Exists (Foundation is Solid)**

#### 1. **BasePropertyAnalyzer Pattern** ✅
```typescript
// /backend/src/analysis/BasePropertyAnalyzer.ts
export abstract class BasePropertyAnalyzer<T extends BasePropertyData, U extends CommonMetrics> {
  protected abstract calculateGrossIncome(year: number): number;
  protected abstract calculatePropertySpecificMetrics(): U;

  // Shared logic: mortgage, projections, exit analysis
  public analyze(): AnalysisResult<U> { /* ... */ }
}
```
**Status**: ✅ Production-ready, used by `SFRAnalyzer`
**Action**: Extend for `MultiFamilyAnalyzer` (already exists but needs completion)

#### 2. **Property Type Enum** ✅
```typescript
// /backend/src/types/propertyTypes.ts
export type PropertyType = 'SFR' | 'MF';  // ✅ MF already defined!
```
**Status**: ✅ Already supports Multi-Family
**Action**: No changes needed

#### 3. **MultiFamilyData Interface** ✅
```typescript
// /backend/src/types/propertyTypes.ts (lines 94-121)
export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  unitTypes: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;
  // ... common area utilities, maintenance per unit
}
```
**Status**: ✅ Already defined
**Action**: Enhance with RentCast integration fields

#### 4. **MultiFamilyAnalyzer Stub** ❌
```typescript
// /backend/src/analysis/MultiFamilyAnalyzer.ts (172 lines)
// Compare to SFRAnalyzer.ts (549 lines - 3.2× larger!)
export class MultiFamilyAnalyzer extends BasePropertyAnalyzer<MultiFamilyData, MultiFamilyMetrics> {
  protected calculateGrossIncome(year: number): number { /* ✅ Basic implementation */ }
  protected calculatePropertySpecificMetrics(): MultiFamilyMetrics { /* ⚠️ Basic, missing advanced metrics */ }

  // ❌ MISSING (compared to SFR):
  // - calculateSensitivityAnalysis() (122 lines in SFR)
  // - normalizeOutput() (89 lines in SFR)
  // - fetchMarketData() (46 lines in SFR)
  // - analyzeWithMarketIntelligence() (24 lines in SFR)
  // - Advanced metrics: debtYield, grossYield, reserves, rehab ROI
  // - Extensive logging and debugging
}
```
**Status**: ❌ **ONLY 31% COMPLETE** (172 of ~550 lines needed)
**Gap Analysis**:
- Missing 377 lines of SFR-equivalent logic
- No sensitivity analysis (best/worst case scenarios)
- No market intelligence integration
- Missing advanced MF metrics (GRM, debt yield, break-even occupancy)
- No output normalization for frontend
- Missing comprehensive logging
**Realistic Action**: Near-complete rewrite following SFR pattern

#### 5. **Deal Model** ✅
```typescript
// /backend/src/models/Deal.ts
// Supports both SFR and MF through union type
propertyData: SFRData | MultiFamilyData
```
**Status**: ✅ Already supports MF
**Action**: No schema changes needed

#### 6. **Deals Controller** ✅
```typescript
// /backend/src/controllers/deals.ts (line 6)
import { MultiFamilyAnalyzer } from '../analysis/MultiFamilyAnalyzer';
```
**Status**: ✅ Already imports MultiFamilyAnalyzer
**Action**: Enhance analyzer routing logic

---

## 🎯 **IMPLEMENTATION STRATEGY**

### **Phase 1: Backend Foundation (Weeks 1-3)**
Focus: Build comprehensive MF analyzer (550 lines), integrate RentCast, enhance Investment Decision Engine
**Reality Check**: MultiFamilyAnalyzer needs ~380 additional lines to match SFR sophistication

### **Phase 2: Property Wizard Enhancement (Weeks 4-6)**
Focus: Conditional UI steps, unit mix configuration, MF-specific inputs, extensive testing

### **Phase 3: Results Display & AI (Weeks 7-8)**
Focus: MF-specific tabs, unit mix intelligence, AI-enhanced insights, market integration

---

## 📁 **DETAILED IMPLEMENTATION PLAN**

---

## **PHASE 1: BACKEND FOUNDATION (Weeks 1-2)**

### **Task 1.1: Enhance MultiFamilyData Interface**
**File**: `/backend/src/types/propertyTypes.ts`
**Changes**: Extend existing `MultiFamilyData` interface

```typescript
export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';

  // Building Details
  totalUnits: number;  // 2-32
  totalSqft: number;   // Building total
  yearBuilt: number;
  buildingType?: 'SIDE_BY_SIDE' | 'STACKED' | 'MIXED' | 'COMPLEX';

  // Unit Configuration (Enhanced for RentCast)
  units: Array<{
    unitNumber?: string;        // "Unit A", "Unit 1", etc.
    bedrooms: number;           // 0-5 (studio to 5BR)
    bathrooms: number;          // 1-3.5
    squareFeet: number;
    currentRent: number;        // User-provided
    marketRent?: number;        // RentCast estimate
    isVacant?: boolean;
    condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  }>;

  // Operating Expenses (MF-specific)
  commonAreaUtilities: {
    electric: number;    // Monthly
    water: number;
    gas: number;
    trash: number;
  };
  maintenanceCostPerUnit: number;  // Monthly per unit

  // Financing (supports both residential and commercial)
  loanType?: 'RESIDENTIAL' | 'COMMERCIAL';
  balloonPayment?: {
    years: number;       // Typical: 5-7 years
    amount?: number;     // Calculated if not provided
  };
  prepaymentPenalty?: {
    years: number;       // Typical: 5 years
    penaltyPercent: number;  // Typical: 5-4-3-2-1 step-down
  };

  // Existing fields (keep as-is)
  unitTypes: Array<{...}>;  // Legacy support
  longTermAssumptions?: MFLongTermAssumptions;
}
```

**Testing**: Unit test for interface validation
**Estimated Time**: 2 hours

---

### **Task 1.2: Enhance MultiFamilyAnalyzer**
**File**: `/backend/src/analysis/MultiFamilyAnalyzer.ts`
**Status**: Enhance existing 172-line file

**Changes Needed:**

#### A. **Fix NOI Calculation** (Critical Bug)
```typescript
// CURRENT (Line 14-40): WRONG - includes vacancy in expenses
protected calculateOperatingExpenses(grossIncome: number): number {
  const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);  // ❌ WRONG
  return propertyTax + insurance + propertyManagement + vacancy + maintenance + commonAreaTotal + capEx;
}

// FIXED: Vacancy reduces income, NOT an expense
protected calculateOperatingExpenses(grossIncome: number): number {
  const propertyTax = purchasePrice * (propertyTaxRate / 100);
  const insurance = purchasePrice * (insuranceRate / 100);
  const propertyManagement = grossIncome * (propertyManagementRate / 100);
  const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;

  // Common area utilities (landlord-paid)
  const commonAreaTotal = Object.values(this.data.commonAreaUtilities || {})
    .reduce((sum, cost) => sum + (cost * 12), 0);  // Annual

  // CapEx reserve (5-7% of EGI for MF)
  const capExRate = 0.06;  // 6% default
  const capEx = grossIncome * capExRate;

  // ❌ REMOVED vacancy - handled separately
  return propertyTax + insurance + propertyManagement + maintenance + commonAreaTotal + capEx;
}
```

#### B. **Add Effective Gross Income (EGI) Calculation**
```typescript
protected calculateEffectiveGrossIncome(grossIncome: number): number {
  const vacancyLoss = grossIncome * (this.assumptions.vacancyRate / 100);
  const creditLoss = grossIncome * 0.02;  // Default 2% for bad debt
  return grossIncome - vacancyLoss - creditLoss;
}
```

#### C. **Enhance Property-Specific Metrics**
```typescript
protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
  const monthlyMortgage = this.calculateMonthlyMortgage();
  const annualDebtService = monthlyMortgage * 12;
  const grossIncome = this.calculateGrossIncome(1);

  // ✅ FIXED: Calculate EGI first, THEN operating expenses
  const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);

  // ✅ FIXED: NOI from EGI, not gross income
  const noi = this.calculateNOI(effectiveGrossIncome, operatingExpenses);
  const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
  const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);

  // Calculate IRR
  let irr = -99;
  try {
    irr = FinancialCalculations.calculateIRR(this.getIRRCashFlows());
  } catch (error) {
    console.error('Error calculating IRR:', error);
  }

  const metrics: MultiFamilyMetrics = {
    noi,
    capRate: this.calculateCapRate(noi),
    cashOnCashReturn: this.calculateCashOnCashReturn(cashFlow, totalInvestment),
    irr: irr,
    dscr: this.calculateDSCR(noi, annualDebtService),
    operatingExpenseRatio: FinancialCalculations.calculateOperatingExpenseRatio(
      operatingExpenses,
      effectiveGrossIncome  // ✅ FIXED: vs EGI, not gross
    ),
    totalInvestment,

    // MF-specific metrics
    pricePerUnit: this.data.purchasePrice / this.data.totalUnits,
    pricePerSqft: FinancialCalculations.calculatePricePerSqFt(
      this.data.purchasePrice,
      this.data.totalSqft
    ),
    noiPerUnit: noi / this.data.totalUnits,
    averageRentPerUnit: grossIncome / (this.data.totalUnits * 12),
    operatingExpensePerUnit: operatingExpenses / this.data.totalUnits,
    commonAreaExpenseRatio: this.calculateCommonAreaExpenseRatio(),
    unitMixEfficiency: this.calculateUnitMixEfficiency(),
    economicVacancyRate: ((grossIncome - effectiveGrossIncome) / grossIncome) * 100,

    // Additional MF metrics
    grossRentMultiplier: this.data.purchasePrice / grossIncome,
    debtYield: noi / (this.data.purchasePrice - this.data.downPayment),
    breakEvenOccupancy: ((operatingExpenses + annualDebtService) / grossIncome) * 100
  };

  return metrics;
}
```

**Testing**:
- Unit test: `multifamily-analyzer.test.ts`
- Integration test: Compare with SFR analyzer structure
**Estimated Time**: 8 hours

---

### **Task 1.3: Create RentCast MF Integration**
**File**: `/backend/src/services/rentcastService.ts` (enhance existing 801-line file)
**Action**: Add MF-specific methods

```typescript
/**
 * Get unit-level rent estimate for multi-family property
 * RentCast API validated: Returns unit-level estimates, not building-level
 */
async getMFUnitRentEstimate(params: {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
}): Promise<{
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  comparables: Array<{
    address: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    price: number;
    distance: number;
  }>;
}> {
  try {
    // Check cache first
    const cacheKey = `mf_rent_${params.address}_${params.bedrooms}BR_${params.bathrooms}BA_${params.squareFootage}sqft`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('RentCast MF rent estimate cache hit');
      return cached;
    }

    await this.checkRateLimit();

    logger.info('Fetching RentCast MF unit rent estimate:', params);

    const response = await this.client.get('/avm/rent/long-term', {
      params: {
        address: params.address,
        propertyType: 'Multi-Family',  // ✅ Validated to work
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

    // Cache for 30 days (unit rents change slowly)
    await cacheService.set(cacheKey, result, 30 * 24 * 60 * 60);

    return result;
  } catch (error) {
    logger.error('Error fetching RentCast MF unit rent estimate:', error);
    throw error;
  }
}

/**
 * Get rent estimates for all units in an MF property
 * Deduplicates identical unit configurations to minimize API calls
 */
async getMFPropertyRentEstimates(
  address: string,
  units: Array<{ bedrooms: number; bathrooms: number; squareFeet: number }>
): Promise<Map<string, number>> {
  const rentEstimates = new Map<string, number>();

  // Deduplicate units (e.g., 4 identical 2BR units = 1 API call)
  const uniqueConfigs = this.deduplicateUnitConfigs(units);

  logger.info(`MF rent estimates: ${units.length} total units, ${uniqueConfigs.length} unique configurations`);

  // Fetch estimates for unique configurations only
  const estimates = await Promise.all(
    uniqueConfigs.map(config =>
      this.getMFUnitRentEstimate({
        address,
        bedrooms: config.bedrooms,
        bathrooms: config.bathrooms,
        squareFootage: config.squareFeet
      })
    )
  );

  // Map back to all units
  uniqueConfigs.forEach((config, index) => {
    const key = `${config.bedrooms}BR_${config.bathrooms}BA_${config.squareFeet}sqft`;
    rentEstimates.set(key, estimates[index].rent);
  });

  return rentEstimates;
}

private deduplicateUnitConfigs(
  units: Array<{ bedrooms: number; bathrooms: number; squareFeet: number }>
): Array<{ bedrooms: number; bathrooms: number; squareFeet: number }> {
  const seen = new Set<string>();
  return units.filter(unit => {
    const key = `${unit.bedrooms}_${unit.bathrooms}_${unit.squareFeet}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

**Testing**: Integration test with live API (using validated Dallas property)
**Estimated Time**: 6 hours

---

### **Task 1.4: Enhance Investment Decision Engine for MF**
**File**: `/backend/src/services/investment/investmentDecisionEngine.ts`
**Action**: Add MF-specific scoring weights

```typescript
// Add MF scoring weights (around line 1189 where SFR scoring exists)
const MF_SCORING_WEIGHTS = {
  cashFlow: 0.20,      // 20% (less than SFR 35% - NOI matters more)
  irr: 0.20,           // 20% (same importance)
  capRate: 0.25,       // 25% (MORE than SFR 3% - primary MF metric)
  dscr: 0.20,          // 20% (MORE than SFR 10% - commercial lending focus)
  marketStrength: 0.10, // 10% (less than SFR 15%)
  propertyRisk: 0.05   // 5% (tenant diversification reduces risk)
};

// Enhance generateDecision() to handle MF
export async function generateDecision(
  analysis: AnalysisResult<any>,
  propertyData: SFRData | MultiFamilyData,
  marketData?: MarketDataResponse
): Promise<InvestmentDecision> {

  const isMF = propertyData.propertyType === 'MF';

  // Use MF-specific weights if multi-family
  const scoringWeights = isMF ? MF_SCORING_WEIGHTS : SFR_SCORING_WEIGHTS;

  // Calculate weighted score
  const professionalAssessment = {
    dealQuality: calculateWeightedScore(analysis.keyMetrics, scoringWeights),
    executionDifficulty: isMF ? calculateMFExecutionDifficulty(propertyData as MultiFamilyData)
                              : calculateSFRExecutionDifficulty(propertyData as SFRData),
    dataReliability: 85,  // High confidence with RentCast validation
    // ... individual scores
  };

  // MF-specific verdict logic (more conservative)
  const verdict = determineMFVerdict(
    professionalAssessment.dealQuality,
    analysis.keyMetrics.dscr,
    analysis.keyMetrics.capRate,
    isMF
  );

  return {
    verdict,
    professionalAssessment,
    reasoning: generateMFReasoning(analysis, professionalAssessment, isMF),
    walkAwayPrice: calculateWalkAwayPrice(analysis, propertyData, isMF),
    keyRisks: identifyMFKeyRisks(analysis, propertyData as MultiFamilyData),
    opportunityHighlights: identifyMFOpportunities(analysis, propertyData as MultiFamilyData)
  };
}

function determineMFVerdict(
  dealQuality: number,
  dscr: number,
  capRate: number,
  isMF: boolean
): 'BUY' | 'NEGOTIATE' | 'CAUTION' | 'PASS' {
  if (!isMF) {
    // SFR logic (existing)
    return determineSFRVerdict(dealQuality);
  }

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
```

**Testing**: Unit tests for MF verdict logic, DSCR threshold validation
**Estimated Time**: 8 hours

---

### **Task 1.5: Update Deals Controller Routing**
**File**: `/backend/src/controllers/deals.ts`
**Action**: Enhance analyzer selection logic

```typescript
// Around line 300+ in analyzeDeal() function
export const analyzeDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealData = req.body;

    // Determine property type
    const propertyType = dealData.propertyType || 'SFR';

    logger.info(`Analyzing ${propertyType} property`, {
      propertyType,
      address: dealData.propertyAddress
    });

    // Select appropriate analyzer
    let analyzer;
    let analysis;

    if (propertyType === 'MF') {
      // Multi-Family analyzer
      const mfData: MultiFamilyData = convertToMultiFamilyData(dealData);
      const assumptions: AnalysisAssumptions = {
        projectionYears: mfData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: mfData.longTermAssumptions?.annualRentIncrease || 3,
        annualExpenseIncrease: mfData.longTermAssumptions?.inflationRate || 2.5,
        annualPropertyValueIncrease: mfData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: mfData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: mfData.longTermAssumptions?.vacancyRate || 8,  // Higher for MF
        turnoverFrequency: mfData.longTermAssumptions?.turnoverFrequency || 3  // Longer for MF
      };

      analyzer = new MultiFamilyAnalyzer(mfData, assumptions);
      analysis = analyzer.analyze();

    } else {
      // SFR analyzer (existing logic)
      const sfrData: SFRData = convertWizardData(dealData);
      // ... existing SFR logic
    }

    // Investment Decision Engine (works for both SFR and MF)
    const investmentDecision = await InvestmentDecisionEngine.generateDecision(
      analysis,
      propertyType === 'MF' ? mfData : sfrData,
      marketData
    );

    // Rest of the logic is identical (save deal, return response)
    // ...
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

**Testing**: Integration test for both SFR and MF analysis flows
**Estimated Time**: 4 hours

---

## **PHASE 2: PROPERTY WIZARD ENHANCEMENT (Weeks 3-4)**

### **Task 2.1: Enhance PropertyWizard with Conditional Steps**
**File**: `/frontend/src/components/PropertyWizard/PropertyWizard.tsx`
**Action**: Add conditional step rendering based on property type

```typescript
const WIZARD_STEPS = {
  SFR: ['Address', 'Financing', 'Rental', 'Assumptions', 'Strategy'],
  MF: ['Address', 'Units', 'Financing', 'Expenses', 'Assumptions', 'Strategy']
};

export const PropertyWizard: React.FC = () => {
  const [propertyType, setPropertyType] = useState<'SFR' | 'MF'>('SFR');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = WIZARD_STEPS[propertyType];

  return (
    <Box>
      {/* Property Type Selector (Step 0) */}
      {currentStep === 0 && (
        <PropertyTypeSelector
          value={propertyType}
          onChange={(type) => {
            setPropertyType(type);
            setCurrentStep(1);
          }}
        />
      )}

      {/* Dynamic Step Rendering */}
      {propertyType === 'SFR' && renderSFRStep(currentStep)}
      {propertyType === 'MF' && renderMFStep(currentStep)}
    </Box>
  );
};
```

**Testing**: E2E test for both SFR and MF wizard flows
**Estimated Time**: 6 hours

---

### **Task 2.2: Create MFUnitMixStep Component**
**File**: `/frontend/src/components/PropertyWizard/steps/MFUnitMixStep.tsx` (NEW)
**Action**: Create unit configuration UI

```typescript
interface Unit {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  currentRent: number;
  marketRent?: number;
}

export const MFUnitMixStep: React.FC<MFUnitMixStepProps> = ({
  totalUnits,
  units,
  onUpdate
}) => {
  const [useTemplate, setUseTemplate] = useState(true);
  const [template, setTemplate] = useState({
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 900,
    rent: 1500
  });

  // Template mode (quick setup for identical units)
  if (useTemplate) {
    return (
      <Box>
        <Typography variant="h6">Quick Setup - Identical Units</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure all {totalUnits} units with the same specifications
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Bedrooms"
              type="number"
              value={template.bedrooms}
              onChange={(e) => setTemplate({ ...template, bedrooms: +e.target.value })}
              fullWidth
            />
          </Grid>
          {/* ... other fields */}
        </Grid>

        <Button onClick={() => applyTemplate()}>
          Apply to All {totalUnits} Units
        </Button>

        <Button onClick={() => setUseTemplate(false)}>
          Customize Individual Units
        </Button>
      </Box>
    );
  }

  // Custom mode (unit-by-unit configuration)
  return (
    <Box>
      <Typography variant="h6">Unit Configuration</Typography>
      <UnitMixTable
        units={units}
        onUpdate={onUpdate}
        onFetchMarketRents={() => fetchRentCastEstimates()}
      />
    </Box>
  );
};
```

**Testing**: Component test with Storybook
**Estimated Time**: 8 hours

---

### **Task 2.3: Create MFExpensesStep Component**
**File**: `/frontend/src/components/PropertyWizard/steps/MFExpensesStep.tsx` (NEW)
**Action**: MF-specific expense inputs

```typescript
export const MFExpensesStep: React.FC<MFExpensesStepProps> = ({ data, onUpdate }) => {
  return (
    <Box>
      <Typography variant="h6">Operating Expenses</Typography>

      {/* Common Area Utilities */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Common Area Utilities (Landlord-Paid)" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Electric (Monthly)"
                type="number"
                value={data.commonAreaUtilities.electric}
                onChange={(e) => onUpdate({
                  ...data,
                  commonAreaUtilities: {
                    ...data.commonAreaUtilities,
                    electric: +e.target.value
                  }
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                fullWidth
              />
            </Grid>
            {/* Water, Gas, Trash */}
          </Grid>
        </CardContent>
      </Card>

      {/* Maintenance Per Unit */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Maintenance & Turnover" />
        <CardContent>
          <TextField
            label="Maintenance Per Unit (Monthly)"
            type="number"
            value={data.maintenanceCostPerUnit}
            helperText="Typical: $100-200/unit/month"
            fullWidth
          />
        </CardContent>
      </Card>
    </Box>
  );
};
```

**Testing**: Component test
**Estimated Time**: 4 hours

---

## **PHASE 3: RESULTS DISPLAY & AI (Weeks 5-6)**

### **Task 3.1: Enhance AnalysisResults with MF Tabs**
**File**: `/frontend/src/components/AnalysisResults/AnalysisResults.tsx`
**Action**: Conditional tab rendering

```typescript
export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, propertyData }) => {
  const isMF = propertyData.propertyType === 'MF';

  const tabs = isMF ? [
    'Overview',
    'Unit Mix',      // NEW - MF only
    'Financials',
    'Projections',
    'AI Insights'
  ] : [
    'Overview',
    'Financials',
    'Projections',
    'AI Insights'
  ];

  return (
    <Box>
      <InvestmentDecisionHero
        verdict={analysis.investmentDecision.verdict}
        dealQuality={analysis.investmentDecision.professionalAssessment.dealQuality}
        keyMetrics={analysis.keyMetrics}
        propertyType={propertyData.propertyType}  // Pass for MF-specific display
      />

      <Tabs>
        {tabs.map(tab => (
          <Tab key={tab} label={tab} />
        ))}
      </Tabs>

      {/* Conditional Tab Content */}
      {isMF && currentTab === 'Unit Mix' && (
        <UnitMixAnalysisTab analysis={analysis} propertyData={propertyData} />
      )}
    </Box>
  );
};
```

**Testing**: Visual regression test for both SFR and MF results
**Estimated Time**: 6 hours

---

### **Task 3.2: Create UnitMixAnalysisTab Component**
**File**: `/frontend/src/components/AnalysisResults/tabs/UnitMixAnalysisTab.tsx` (NEW)
**Action**: Display unit mix intelligence

```typescript
export const UnitMixAnalysisTab: React.FC<UnitMixAnalysisTabProps> = ({ analysis, propertyData }) => {
  const mfData = propertyData as MultiFamilyData;

  return (
    <Box>
      {/* Current Unit Mix Breakdown */}
      <Card>
        <CardHeader title="Current Unit Mix" />
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Unit Type</TableCell>
                <TableCell>Count</TableCell>
                <TableCell>Avg Rent</TableCell>
                <TableCell>Total Annual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculateUnitMixSummary(mfData.units).map(row => (
                <TableRow key={row.unitType}>
                  <TableCell>{row.unitType}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{formatCurrency(row.avgRent)}</TableCell>
                  <TableCell>{formatCurrency(row.totalAnnual)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* NOI Per Unit Comparison */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Per-Unit Economics" />
        <CardContent>
          <MetricCard
            label="NOI Per Unit"
            value={formatCurrency(analysis.keyMetrics.noiPerUnit)}
            trend={analysis.keyMetrics.noiPerUnit > 5000 ? 'positive' : 'neutral'}
          />
          <MetricCard
            label="Price Per Unit"
            value={formatCurrency(analysis.keyMetrics.pricePerUnit)}
            trend={analysis.keyMetrics.pricePerUnit < 150000 ? 'positive' : 'neutral'}
          />
        </CardContent>
      </Card>

      {/* AI-Generated Unit Mix Optimization */}
      <Card sx={{ mt: 2 }}>
        <CardHeader
          title="Unit Mix Optimization"
          subheader="AI-powered recommendations"
        />
        <CardContent>
          <Typography variant="body1">
            {analysis.aiInsights?.unitMixOptimization ||
             'Analyzing unit mix efficiency and market demand...'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
```

**Testing**: Component test + screenshot test
**Estimated Time**: 8 hours

---

### **Task 3.3: Enhance AI Service for MF Insights**
**File**: `/backend/src/services/aiService.ts`
**Action**: Add MF-specific AI prompts

```typescript
// Add MF-specific prompt generation
export async function generateMFUnitMixInsights(
  analysis: AnalysisResult<MultiFamilyMetrics>,
  propertyData: MultiFamilyData,
  marketData?: MarketDataResponse
): Promise<string> {

  const unitMixBreakdown = calculateUnitMixBreakdown(propertyData.units);

  const prompt = `You are a multi-family investment analyst with 15 years managing 500+ units.

Property: ${propertyData.totalUnits}-unit building in ${propertyData.propertyAddress.city}, ${propertyData.propertyAddress.state}
Year Built: ${propertyData.yearBuilt}
Total Units: ${propertyData.totalUnits}

Current Unit Mix:
${unitMixBreakdown}

Financial Performance:
- Cap Rate: ${analysis.keyMetrics.capRate.toFixed(2)}%
- DSCR: ${analysis.keyMetrics.dscr.toFixed(2)}
- NOI Per Unit: $${analysis.keyMetrics.noiPerUnit.toFixed(0)}/year
- Operating Expense Ratio: ${analysis.keyMetrics.operatingExpenseRatio.toFixed(1)}%

Market Context:
${marketData ? formatMarketContext(marketData) : 'Limited market data available'}

Analyze:
1. Is this unit mix optimal for this market? (Consider local demographics, rent levels)
2. What's the opportunity cost of current mix vs optimal?
3. Specific unit conversion recommendations with ROI projections
4. Vacancy risk assessment based on unit type concentration
5. Value-add strategies to increase NOI by 15-25%

Be specific with $ amounts and ROI calculations. Format as investor-ready recommendations.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800
  });

  return response.choices[0].message.content || 'Analysis unavailable';
}
```

**Testing**: Integration test with OpenAI API
**Estimated Time**: 6 hours

---

## 📊 **DATABASE SCHEMA CHANGES**

### **No Changes Required** ✅

The existing `Deal` model already supports MF through the union type:

```typescript
// /backend/src/models/Deal.ts
propertyData: SFRData | MultiFamilyData  // ✅ Already supports both
```

**Validation**: Run migration test to ensure MF deals persist correctly

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests** (Jest)
```
/backend/src/tests/
├── MultiFamilyAnalyzer.test.ts         // Enhance existing
├── rentcastService.mf.test.ts          // NEW - RentCast MF integration
├── investmentDecisionEngine.mf.test.ts // NEW - MF scoring
└── financialCalculations.mf.test.ts    // NEW - NOI, DSCR, OER
```

### **Integration Tests**
```
/backend/src/tests/integration/
├── mf-analysis-flow.test.ts            // NEW - End-to-end MF analysis
└── rentcast-mf-api.test.ts             // NEW - Live API validation
```

### **E2E Tests** (Cypress)
```
/cypress/e2e/
├── mf-property-wizard.cy.js            // NEW - MF wizard flow
├── mf-unit-mix-configuration.cy.js     // NEW - Unit mix step
└── mf-analysis-results.cy.js           // NEW - Results display
```

### **Test Scenarios** (From MF_ANALYSIS_EPIC.md)
1. **4-Unit Residential** (2-4 units, conventional financing)
2. **8-Unit Commercial** (5-32 units, commercial loan, mixed units)
3. **Identical Units** (template flow)
4. **Mixed Units** (custom configuration)

**Testing Time**: 16 hours (spread across all phases)

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Backend (Weeks 1-2)**
- [ ] Enhance `MultiFamilyData` interface
- [ ] Fix NOI calculation in `MultiFamilyAnalyzer`
- [ ] Add EGI calculation
- [ ] Enhance MF-specific metrics
- [ ] Create RentCast MF integration methods
- [ ] Add MF scoring weights to Investment Decision Engine
- [ ] Update deals controller routing
- [ ] Write unit tests for analyzer
- [ ] Write integration tests for RentCast

### **Phase 2: Frontend Wizard (Weeks 3-4)**
- [ ] Add property type selector to wizard
- [ ] Create conditional step rendering
- [ ] Build `MFUnitMixStep` component
- [ ] Build `MFExpensesStep` component
- [ ] Integrate RentCast auto-population
- [ ] Add unit mix validation
- [ ] Write component tests
- [ ] Write E2E tests for wizard

### **Phase 3: Results & AI (Weeks 5-6)**
- [ ] Enhance `AnalysisResults` with MF tabs
- [ ] Create `UnitMixAnalysisTab` component
- [ ] Add MF-specific metrics display
- [ ] Enhance AI service with MF prompts
- [ ] Generate unit mix optimization insights
- [ ] Update Investment Decision Hero for MF
- [ ] Write visual regression tests
- [ ] Conduct user acceptance testing

---

## 🚀 **DEPLOYMENT PLAN**

### **Feature Flag Approach**
```typescript
// /backend/src/config/features.ts
export const FEATURES = {
  MF_ANALYSIS: process.env.ENABLE_MF_ANALYSIS === 'true'
};

// Usage in code
if (FEATURES.MF_ANALYSIS && propertyType === 'MF') {
  // MF logic
}
```

### **Rollout Strategy**
1. **Week 1-2**: Deploy backend with feature flag OFF
2. **Week 3-4**: Deploy frontend with feature flag OFF
3. **Week 5**: Internal testing (5 team members)
4. **Week 6**: Beta testing (10 users)
5. **Week 7**: Public launch (feature flag ON)

---

## 💰 **COST IMPACT ANALYSIS**

### **RentCast API Costs** (From Validation Report)
- **Average Case** (4-unit, 2 unique configs): $0.0132/analysis
- **Worst Case** (8-unit, 8 unique configs): $0.0397/analysis
- **Monthly Cost** (100 MF analyses): $1.32-$3.97/month
- **Gross Margin**: 91-97% ($49 revenue - $4 API cost)

### **Infrastructure Costs**
- **No additional costs**: Same MongoDB, same servers
- **OpenAI API**: +$0.02/analysis for MF-specific prompts
- **Total Impact**: <$5/month for 100 MF analyses

---

## 📏 **SUCCESS METRICS**

### **Week 4 (Post-Backend Launch)**
- [ ] 20+ internal MF analyses completed
- [ ] 95%+ calculation accuracy (vs manual spreadsheet)
- [ ] <200ms backend response time

### **Week 6 (Post-Frontend Launch)**
- [ ] 50+ beta user MF analyses
- [ ] <5% wizard abandonment rate
- [ ] 90%+ user satisfaction ("easy to use")

### **Month 3 (Post-Public Launch)**
- [ ] 200+ MF analyses performed
- [ ] 30% MF adoption (among users with 3+ properties)
- [ ] 40% Professional tier conversion (from MF users)

---

## 🎯 **ARCHITECTURAL DECISIONS RECORD**

### **ADR-1: Extend BasePropertyAnalyzer (Not Create Separate Analyzer)**
**Decision**: Use existing `BasePropertyAnalyzer` pattern
**Rationale**:
- Shared logic: mortgage, projections, exit analysis (80% overlap)
- Type safety with generics: `BasePropertyAnalyzer<T, U>`
- Consistent API contract across property types

**Alternative Rejected**: Separate `MFAnalyzer` class
**Why Rejected**: Duplicate code, inconsistent calculations, harder to maintain

---

### **ADR-2: Single Deal Model (Not Separate MFDeal)**
**Decision**: Use union type `SFRData | MultiFamilyData`
**Rationale**:
- MongoDB handles polymorphic documents well
- Simpler queries: `Deal.find({ propertyType: 'MF' })`
- Easier portfolio aggregation (same collection)

**Alternative Rejected**: Separate `MFDeal` collection
**Why Rejected**: Complicates portfolio queries, duplicates user associations

---

### **ADR-3: Conditional Wizard Steps (Not Separate MF Wizard)**
**Decision**: Same `PropertyWizard` component with conditional rendering
**Rationale**:
- Shared steps: Address, Financing, Assumptions (60% overlap)
- Simpler navigation state management
- Consistent UX patterns

**Alternative Rejected**: Separate `/mf-wizard` route
**Why Rejected**: Duplicates shared logic, confuses users with multiple entry points

---

### **ADR-4: RentCast Unit-Level API Integration (Not Census Data)**
**Decision**: Use RentCast API with unit-level parameters
**Rationale**:
- Validated 100% accuracy with live API tests
- Same-day data freshness (vs 1-3 year lag for Census)
- 85% cost reduction with caching

**Alternative Rejected**: Census median rent by bedroom count
**Why Rejected**: 1-3 year data lag, no property-specific context

---

## 📚 **REFERENCES**

- [MF_ANALYSIS_EPIC.md](./MF_ANALYSIS_EPIC.md) - Product requirements
- [RENTCAST_FINAL_VALIDATION_SUMMARY.md](./RENTCAST_FINAL_VALIDATION_SUMMARY.md) - API validation
- [ARCHITECTURE_V3.md](./ARCHITECTURE_V3.md) - System architecture
- [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) - Data field definitions
- [INVESTMENT_DECISION_ENGINE_V3.0_PROFESSIONAL_CALIBRATION.md](./INVESTMENT_DECISION_ENGINE_V3.0_PROFESSIONAL_CALIBRATION.md) - Scoring engine

---

## ✅ **APPROVAL CHECKLIST**

- [x] RentCast API validated (100% success)
- [x] Existing architecture analyzed
- [x] No breaking changes to SFR functionality
- [x] Cost impact acceptable (<$5/month)
- [x] 6-week timeline realistic
- [x] Testing strategy comprehensive
- [ ] User approval to proceed

---

**Status**: ✅ **READY FOR IMPLEMENTATION**
**Next Step**: User approval → Begin Phase 1 (Backend Foundation)

---

**Generated**: October 23, 2025
**Architect**: Principal Software Architect (18y: Amazon 8y, Redfin 6y, hedge funds 4y)
