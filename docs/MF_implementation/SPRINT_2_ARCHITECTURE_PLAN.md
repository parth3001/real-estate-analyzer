# Sprint 2: Investment Decision Engine Architecture Plan

**Created**: October 29, 2025
**Architect**: Principal Software Architect (18 years, Amazon/Redfin)
**Sprint Duration**: 80 hours (2 weeks)
**Status**: PLANNING PHASE

---

## 🎯 SPRINT 2 GOAL

**Refactor Investment Decision Engine to support multiple property types (SFR + MF) using polymorphic inheritance pattern**

### **Success Criteria**
- ✅ `BaseDecisionEngine<T>` abstract class created
- ✅ `SFRDecisionEngine` extends base with SFR-specific logic
- ✅ `MFDecisionEngine` extends base with MF-specific logic
- ✅ Zero SFR regressions (100% test pass rate)
- ✅ MF verdicts use cap rate (25%) + DSCR (20%) weighting
- ✅ Walk-away price uses NOI / target cap rate for MF

---

## 📐 CURRENT ARCHITECTURE ANALYSIS

### **Existing Implementation**

**File**: `/backend/src/services/investment/investmentDecisionEngine.ts`
- **Lines**: 3,546 lines
- **Type**: Monolithic class
- **Property Type**: Hardcoded to `SFRData` (12 occurrences)
- **Issue**: Cannot support Multi-Family without massive duplication

### **Current Class Structure**

```typescript
export class InvestmentDecisionEngine {
  // Hardcoded to SFR
  generateDecision(
    analysis: any,
    propertyData: SFRData,  // ← PROBLEM: SFR-only
    marketData?: MarketDataResponse
  ): InvestmentDecision {
    // 3,500 lines of SFR-specific logic
  }
}
```

### **Dependencies**
- `LeverageOptimizer` - Analyzes debt structure
- `MarketTierService` - Classifies markets (A/B/C)
- `PropertyClassificationService` - Property quality assessment
- `StrategyAlignmentService` - User strategy matching
- `SensitivityAnalysisService` - Best/worst case scenarios
- `aiEnhancedMessagingService` - AI content generation
- `taxCalculationService` - Tax optimization

**All dependencies are property-type agnostic** ✅ (can work with SFR or MF)

---

## 🏗️ TARGET ARCHITECTURE (Polymorphic Pattern)

### **Design Pattern: Abstract Base Class + Specialized Subclasses**

```
BaseDecisionEngine<T extends CommonMetrics>
├── SFRDecisionEngine (SFR-specific scoring)
└── MFDecisionEngine (MF-specific scoring)
```

### **Why This Pattern?**

1. **DRY Principle**: Common logic in base, specialized logic in subclasses
2. **Type Safety**: Generic `<T>` ensures compile-time property type validation
3. **Extensibility**: Easy to add Commercial, Industrial property types later
4. **Testability**: Test base class once, test subclasses for differences
5. **SFR Compatibility**: Existing code works with minimal changes

---

## 📋 SPRINT 2 STORY BREAKDOWN

### **Story 2.1: Extract BaseDecisionEngine** (24 hours)

**Goal**: Create abstract base class with common decision logic

**Files to Create**:
- `/backend/src/services/investment/BaseDecisionEngine.ts` (new)

**Files to Modify**:
- `/backend/src/services/investment/investmentDecisionEngine.ts` (refactor)

**What Moves to Base Class**:

✅ **Common Methods** (90% of code):
- `generateDecision()` - Main orchestration (property-type agnostic)
- `calculateProfessionalAssessment()` - Scoring framework
- `generateActionPlan()` - Action item generation
- `generateCapitalStrategy()` - Capital deployment advice
- `generateMarketContext()` - Market analysis
- `generateAlternatives()` - Alternative options
- `buildAIEnhancedContent()` - AI content generation
- `performTaxAnalysis()` - Tax optimization

⚠️ **Abstract Methods** (Must be implemented by subclasses):
- `abstract getScoringWeights(): ScoringWeights`
- `abstract calculateWalkAwayPrice(): number`
- `abstract scoreProperty(): PropertyScores`
- `abstract getPropertyTypeSpecificRisks(): string[]`

**Interface Design**:

```typescript
// /backend/src/services/investment/BaseDecisionEngine.ts

export interface ScoringWeights {
  cashFlow: number;      // 0.0-1.0 (must sum to 1.0)
  irr: number;
  capRate: number;       // SFR: 0.03, MF: 0.25 ← KEY DIFFERENCE
  dscr: number;          // SFR: 0.10, MF: 0.20 ← KEY DIFFERENCE
  marketStrength: number;
  exitStrategy: number;
  propertyRisk: number;
}

export interface PropertyScores {
  cashFlowScore: number; // 0-100
  irrScore: number;      // 0-100
  capRateScore: number;  // 0-100
  dscrScore: number;     // 0-100
  marketStrengthScore: number;
  exitStrategyScore: number;
  propertyRiskScore: number;
}

export abstract class BaseDecisionEngine<T extends CommonMetrics> {
  constructor(
    protected analysis: AnalysisResult<T>,
    protected propertyData: SFRData | MultiFamilyData,  // ← Union type
    protected marketData?: MarketDataResponse,
    protected userGoals?: any
  ) {}

  // PUBLIC API (Same for all property types)
  public generateDecision(): InvestmentDecision {
    const professionalAssessment = this.calculateProfessionalAssessment();
    const verdict = this.determineVerdict(professionalAssessment.dealQuality);

    return {
      verdict,
      professionalAssessment,
      primaryReason: this.generatePrimaryReason(verdict, professionalAssessment),
      actionPlan: this.generateActionPlan(verdict),
      capitalStrategy: this.generateCapitalStrategy(verdict),
      // ... rest of decision fields
    };
  }

  // ABSTRACT METHODS (Must be implemented by subclasses)
  protected abstract getScoringWeights(): ScoringWeights;
  protected abstract calculateWalkAwayPrice(): number;
  protected abstract scoreProperty(): PropertyScores;
  protected abstract getPropertyTypeSpecificRisks(): string[];

  // COMMON METHODS (Shared by all property types)
  protected calculateProfessionalAssessment(): ProfessionalAssessment {
    const scores = this.scoreProperty(); // ← Calls subclass method
    const weights = this.getScoringWeights(); // ← Calls subclass method

    // Weighted score calculation (same for all types)
    const dealQuality =
      scores.cashFlowScore * weights.cashFlow +
      scores.irrScore * weights.irr +
      scores.capRateScore * weights.capRate +
      scores.dscrScore * weights.dscr +
      scores.marketStrengthScore * weights.marketStrength +
      scores.exitStrategyScore * weights.exitStrategy +
      scores.propertyRiskScore * weights.propertyRisk;

    return {
      dealQuality,
      cashFlowScore: scores.cashFlowScore,
      irrScore: scores.irrScore,
      capRateScore: scores.capRateScore,
      // ... rest of scores
    };
  }

  protected determineVerdict(dealQuality: number): InvestmentVerdict {
    // Same thresholds for all property types
    if (dealQuality >= 75) return 'BUY';
    if (dealQuality >= 65) return 'NEGOTIATE';
    if (dealQuality >= 50) return 'CAUTION';
    return 'PASS';
  }

  // ... 80 more common methods
}
```

**Acceptance Criteria**:
- [ ] `BaseDecisionEngine<T>` compiles with no errors
- [ ] All common methods extracted to base class
- [ ] 4 abstract methods defined
- [ ] Generic type `<T extends CommonMetrics>` works
- [ ] No SFR-specific logic in base class

---

### **Story 2.2: Create SFRDecisionEngine** (16 hours)

**Goal**: Migrate existing SFR logic to new `SFRDecisionEngine` subclass

**Files to Create**:
- `/backend/src/services/investment/SFRDecisionEngine.ts` (new)

**Files to Modify**:
- `/backend/src/services/investment/investmentDecisionEngine.ts` (deprecate, keep for backward compatibility)
- `/backend/src/controllers/deals.ts` (use new SFRDecisionEngine)

**Implementation**:

```typescript
// /backend/src/services/investment/SFRDecisionEngine.ts

import { BaseDecisionEngine, ScoringWeights, PropertyScores } from './BaseDecisionEngine';
import { SFRData, SFRMetrics } from '../../types/propertyTypes';
import { AnalysisResult } from '../../types/analysis';

export class SFRDecisionEngine extends BaseDecisionEngine<SFRMetrics> {
  constructor(
    protected analysis: AnalysisResult<SFRMetrics>,
    protected propertyData: SFRData,
    protected marketData?: MarketDataResponse,
    protected userGoals?: any
  ) {
    super(analysis, propertyData, marketData, userGoals);
  }

  // IMPLEMENT ABSTRACT METHODS

  protected getScoringWeights(): ScoringWeights {
    return {
      cashFlow: 0.35,      // ✨ PRIMARY METRIC for SFR
      irr: 0.25,
      marketStrength: 0.15,
      debtStructure: 0.10,
      exitStrategy: 0.10,
      capRate: 0.03,       // ✨ LOW priority for SFR
      propertyRisk: 0.02
    };
  }

  protected calculateWalkAwayPrice(): number {
    // SFR walk-away price = Comparable sales - 10%
    const purchasePrice = this.propertyData.purchasePrice;
    const marketAdjustment = this.getMarketAdjustment(); // From market data
    return purchasePrice * (1 - 0.10 + marketAdjustment);
  }

  protected scoreProperty(): PropertyScores {
    const metrics = this.analysis.keyMetrics;

    return {
      cashFlowScore: this.scoreCashFlow(metrics.cashFlow), // SFR-specific
      irrScore: this.scoreIRR(metrics.irr),
      capRateScore: this.scoreCapRate(metrics.capRate), // Less important for SFR
      dscrScore: this.scoreDSCR(metrics.dscr),
      marketStrengthScore: this.scoreMarketStrength(),
      exitStrategyScore: this.scoreExitStrategy(),
      propertyRiskScore: this.scorePropertyRisk()
    };
  }

  protected getPropertyTypeSpecificRisks(): string[] {
    const risks: string[] = [];

    // SFR-specific risks
    if (this.propertyData.yearBuilt < 1970) {
      risks.push('Older property may require significant capital improvements');
    }

    if (this.analysis.keyMetrics.cashFlow < 0) {
      risks.push('Negative cash flow requires personal capital injection monthly');
    }

    // Single-family concentration risk
    risks.push('Single-tenant risk - 100% income loss if tenant vacates');

    return risks;
  }

  // SFR-SPECIFIC HELPER METHODS

  private scoreCashFlow(cashFlow: number): number {
    // SFR cash flow scoring (0-100)
    if (cashFlow >= 500) return 100;
    if (cashFlow >= 300) return 90;
    if (cashFlow >= 100) return 75;
    if (cashFlow >= 0) return 50;
    if (cashFlow >= -200) return 25;
    return 0;
  }

  private scoreCapRate(capRate: number): number {
    // SFR cap rate scoring (less important than MF)
    if (capRate >= 8) return 100;
    if (capRate >= 6) return 80;
    if (capRate >= 4) return 60;
    return 40;
  }
}
```

**Migration Strategy**:

1. **Phase 1**: Create `SFRDecisionEngine` with all existing logic
2. **Phase 2**: Update `deals.ts` controller to use new class
3. **Phase 3**: Run all SFR tests (must be 100% passing)
4. **Phase 4**: Deprecate old `InvestmentDecisionEngine` class

**Backward Compatibility**:

```typescript
// Keep old class for backward compatibility (1 sprint deprecation period)
export class InvestmentDecisionEngine {
  generateDecision(
    analysis: any,
    propertyData: SFRData,
    marketData?: MarketDataResponse
  ): InvestmentDecision {
    // Delegate to new SFRDecisionEngine
    const engine = new SFRDecisionEngine(analysis, propertyData, marketData);
    return engine.generateDecision();
  }
}
```

**Acceptance Criteria**:
- [ ] `SFRDecisionEngine` compiles with no errors
- [ ] All 4 abstract methods implemented with SFR logic
- [ ] Scoring weights favor cash flow (35%)
- [ ] Walk-away price uses comparable sales method
- [ ] All existing SFR tests pass (100% pass rate)
- [ ] No changes to InvestmentDecision output structure

---

### **Story 2.3: Create MFDecisionEngine** (16 hours)

**Goal**: Implement Multi-Family-specific decision engine

**Files to Create**:
- `/backend/src/services/investment/MFDecisionEngine.ts` (new)

**Implementation**:

```typescript
// /backend/src/services/investment/MFDecisionEngine.ts

import { BaseDecisionEngine, ScoringWeights, PropertyScores } from './BaseDecisionEngine';
import { MultiFamilyData, MultiFamilyMetrics } from '../../types/propertyTypes';
import { AnalysisResult } from '../../types/analysis';

export class MFDecisionEngine extends BaseDecisionEngine<MultiFamilyMetrics> {
  constructor(
    protected analysis: AnalysisResult<MultiFamilyMetrics>,
    protected propertyData: MultiFamilyData,
    protected marketData?: MarketDataResponse,
    protected userGoals?: any
  ) {
    super(analysis, propertyData, marketData, userGoals);
  }

  // IMPLEMENT ABSTRACT METHODS WITH MF-SPECIFIC LOGIC

  protected getScoringWeights(): ScoringWeights {
    return {
      cashFlow: 0.20,      // ✨ LOWER than SFR (NOI matters more)
      irr: 0.20,
      capRate: 0.25,       // ✨ PRIMARY METRIC for MF (8× higher than SFR!)
      dscr: 0.20,          // ✨ CRITICAL for commercial lending (2× higher than SFR)
      marketStrength: 0.10,
      exitStrategy: 0.05,
      propertyRisk: 0.00   // ✨ Diversified across units
    };
  }

  protected calculateWalkAwayPrice(): number {
    // MF walk-away price = NOI / Target Cap Rate
    // This is THE professional MF valuation method
    const noi = this.analysis.keyMetrics.noi;
    const targetCapRate = this.getTargetCapRate(); // Market-adjusted (4-10%)

    const walkAwayPrice = noi / targetCapRate;

    console.log(`[MF Walk-Away] NOI: $${noi}, Target Cap Rate: ${(targetCapRate * 100).toFixed(1)}%, Walk-Away: $${walkAwayPrice.toFixed(0)}`);

    return Math.round(walkAwayPrice);
  }

  protected scoreProperty(): PropertyScores {
    const metrics = this.analysis.keyMetrics;

    return {
      cashFlowScore: this.scoreCashFlow(metrics.cashFlow), // Less important for MF
      irrScore: this.scoreIRR(metrics.irr),
      capRateScore: this.scoreCapRate(metrics.capRate), // ✨ PRIMARY for MF
      dscrScore: this.scoreDSCR(metrics.dscr),           // ✨ CRITICAL for MF
      marketStrengthScore: this.scoreMarketStrength(),
      exitStrategyScore: this.scoreExitStrategy(),
      propertyRiskScore: 0 // MF is diversified across units
    };
  }

  protected getPropertyTypeSpecificRisks(): string[] {
    const risks: string[] = [];
    const metrics = this.analysis.keyMetrics;

    // MF-specific risks
    if (metrics.dscr < 1.25) {
      risks.push('⚠️ CRITICAL: DSCR < 1.25 - Commercial lender will likely reject loan');
    }

    if (metrics.capRate < 4) {
      risks.push('Low cap rate indicates premium pricing - exit may be difficult');
    }

    if (metrics.economicVacancyRate > 10) {
      risks.push('High vacancy rate (>10%) indicates market weakness or property issues');
    }

    if (this.propertyData.totalUnits < 5) {
      risks.push('1-4 units may require residential financing (harder to qualify)');
    }

    return risks;
  }

  // MF-SPECIFIC HELPER METHODS

  private getTargetCapRate(): number {
    // Market-adjusted target cap rate
    const marketTier = this.getMarketTier(); // A/B/C

    // Cap rate targets by market tier
    const targetCapRates = {
      'A': 0.05,  // Dallas A-Class: 4-6%
      'B': 0.075, // Secondary markets: 7-9%
      'C': 0.10   // Tertiary markets: 9-12%
    };

    return targetCapRates[marketTier] || 0.08; // Default 8%
  }

  private scoreCapRate(capRate: number): number {
    // MF cap rate scoring (PRIMARY metric)
    const targetCapRate = this.getTargetCapRate();

    if (capRate >= targetCapRate + 0.02) return 100; // 2% above target
    if (capRate >= targetCapRate + 0.01) return 90;  // 1% above target
    if (capRate >= targetCapRate) return 80;         // Meets target
    if (capRate >= targetCapRate - 0.01) return 60;  // 1% below target
    if (capRate >= targetCapRate - 0.02) return 40;  // 2% below target
    return 20; // More than 2% below target
  }

  private scoreDSCR(dscr: number): number {
    // MF DSCR scoring (CRITICAL for commercial lending)
    if (dscr >= 1.50) return 100; // Excellent - lenders love this
    if (dscr >= 1.35) return 90;  // Very good - meets strict lender requirements
    if (dscr >= 1.25) return 75;  // Good - meets standard lender requirements
    if (dscr >= 1.15) return 50;  // Borderline - some lenders may accept
    if (dscr >= 1.00) return 25;  // Poor - most lenders will reject
    return 0; // DSCR < 1.0 = Property doesn't cover debt service
  }

  private scoreCashFlow(cashFlow: number): number {
    // MF cash flow scoring (less important than SFR)
    // Per-unit cash flow matters more than total
    const cashFlowPerUnit = cashFlow / this.propertyData.totalUnits;

    if (cashFlowPerUnit >= 200) return 100;
    if (cashFlowPerUnit >= 100) return 80;
    if (cashFlowPerUnit >= 0) return 60;
    if (cashFlowPerUnit >= -50) return 40;
    return 20;
  }
}
```

**Key MF Differences**:

| **Aspect** | **SFR** | **MF** |
|------------|---------|--------|
| **Primary Metric** | Cash Flow (35%) | Cap Rate (25%) |
| **DSCR Weight** | 10% | 20% (2× higher) |
| **Walk-Away Formula** | Comparable sales - 10% | NOI / Target Cap Rate |
| **Property Risk** | 2% (single tenant) | 0% (diversified) |
| **Cap Rate Target** | 6-8% | 4-10% (market-dependent) |

**Acceptance Criteria**:
- [ ] `MFDecisionEngine` compiles with no errors
- [ ] All 4 abstract methods implemented with MF logic
- [ ] Scoring weights favor cap rate (25%) and DSCR (20%)
- [ ] Walk-away price uses NOI / target cap rate formula
- [ ] DSCR < 1.25 triggers critical risk warning
- [ ] Unit tests validate MF-specific scoring
- [ ] Integration test with MultiFamilyAnalyzer from Sprint 1

---

### **Story 2.4: Integration & Testing** (24 hours)

**Goal**: Wire up new engines in controllers, comprehensive testing

**Files to Modify**:
- `/backend/src/controllers/deals.ts` - Use property-type-specific engines
- `/backend/src/routes/deals.ts` - No changes (API backward compatible)

**Controller Integration**:

```typescript
// /backend/src/controllers/deals.ts

import { SFRDecisionEngine } from '../services/investment/SFRDecisionEngine';
import { MFDecisionEngine } from '../services/investment/MFDecisionEngine';

export async function analyzeDeal(req: Request, res: Response) {
  const { propertyType, propertyData } = req.body;

  // Step 1: Run appropriate analyzer
  let analysis, decisionEngine;

  if (propertyType === 'SFR') {
    const analyzer = new SFRAnalyzer(propertyData, assumptions);
    analysis = await analyzer.analyzeWithMarketIntelligence();

    // Step 2: Create property-type-specific decision engine
    decisionEngine = new SFRDecisionEngine(
      analysis,
      propertyData,
      analysis.marketData,
      userGoals
    );
  }
  else if (propertyType === 'Multi-Family') {
    const analyzer = new MultiFamilyAnalyzer(propertyData, assumptions);
    analysis = await analyzer.analyzeWithMarketIntelligence();

    // Step 2: Create MF-specific decision engine
    decisionEngine = new MFDecisionEngine(
      analysis,
      propertyData,
      analysis.marketData,
      userGoals
    );
  }

  // Step 3: Generate decision (same API for both types)
  const decision = decisionEngine.generateDecision();

  // Step 4: Return combined analysis + decision
  return res.json({
    analysis,
    investmentDecision: decision
  });
}
```

**Testing Strategy**:

```typescript
// /backend/src/tests/unit/SFRDecisionEngine.test.ts
describe('SFRDecisionEngine', () => {
  it('should prioritize cash flow (35% weight)', () => {
    const weights = engine.getScoringWeights();
    expect(weights.cashFlow).toBe(0.35);
  });

  it('should calculate walk-away price using comparable sales', () => {
    const walkAway = engine.calculateWalkAwayPrice();
    expect(walkAway).toBeCloseTo(purchasePrice * 0.90, -1000);
  });
});

// /backend/src/tests/unit/MFDecisionEngine.test.ts
describe('MFDecisionEngine', () => {
  it('should prioritize cap rate (25% weight)', () => {
    const weights = engine.getScoringWeights();
    expect(weights.capRate).toBe(0.25);
  });

  it('should calculate walk-away price using NOI / cap rate', () => {
    const noi = 80000;
    const targetCapRate = 0.08;
    const expectedWalkAway = noi / targetCapRate; // $1,000,000

    const walkAway = engine.calculateWalkAwayPrice();
    expect(walkAway).toBeCloseTo(expectedWalkAway, -1000);
  });

  it('should flag DSCR < 1.25 as critical risk', () => {
    const risks = engine.getPropertyTypeSpecificRisks();
    expect(risks).toContain('⚠️ CRITICAL: DSCR < 1.25');
  });
});
```

**Acceptance Criteria**:
- [ ] Controller uses correct engine based on property type
- [ ] API response structure unchanged (backward compatible)
- [ ] All SFR tests pass (100% pass rate)
- [ ] All MF decision engine tests pass
- [ ] Integration test: SFR analyzer → SFR engine → Decision
- [ ] Integration test: MF analyzer → MF engine → Decision
- [ ] Performance: Decision generation < 500ms

---

## ✅ SPRINT 2 EXIT CRITERIA

### **Technical Success**

- [ ] `BaseDecisionEngine<T>` abstract class created
- [ ] `SFRDecisionEngine` fully functional
- [ ] `MFDecisionEngine` fully functional
- [ ] 100% SFR test pass rate (zero regressions)
- [ ] 90%+ MF decision engine test coverage
- [ ] Controllers use property-type-specific engines
- [ ] Performance: Decision generation < 500ms

### **Business Success**

- [ ] MF walk-away prices validated by 10 experienced investors
- [ ] Walk-away prices match investors' negotiation strategies (90%+ agreement)
- [ ] DSCR < 1.25 warnings align with commercial lending requirements
- [ ] Cap rate scoring reflects professional MF valuation methodology

### **Code Quality**

- [ ] TypeScript compilation: Zero errors
- [ ] No code duplication between SFR/MF engines (DRY principle)
- [ ] Generic type safety enforced
- [ ] Comprehensive inline documentation
- [ ] Architect review: 5/5 rating
- [ ] QE validation: 4+/5 rating

---

## 🚧 RISKS & MITIGATION

### **Risk 1: SFR Regressions** (HIGH)

**Likelihood**: Medium
**Impact**: HIGH (breaks existing functionality)

**Mitigation**:
- Run full SFR test suite after each story
- Keep old `InvestmentDecisionEngine` for 1 sprint (backward compatibility)
- Manual testing with 10 real SFR properties

### **Risk 2: Complex Refactor (3,546 lines)** (MEDIUM)

**Likelihood**: High
**Impact**: Medium (delays sprint)

**Mitigation**:
- Break into 4 small stories (24h, 16h, 16h, 24h)
- Incremental refactoring (not big-bang)
- Continuous testing after each story

### **Risk 3: MF Scoring Weight Validation** (MEDIUM)

**Likelihood**: Low
**Impact**: High (lose investor trust)

**Mitigation**:
- Business Expert validation of cap rate (25%) and DSCR (20%) weights
- 10 experienced investor reviews of walk-away prices
- Real-world MF deal testing (5 properties)

---

## 📊 SPRINT 2 SUCCESS METRICS

| **Metric** | **Target** | **How to Measure** |
|------------|------------|-------------------|
| **Test Pass Rate** | 100% SFR, 90%+ MF | Run test suites |
| **Walk-Away Price Accuracy** | 90%+ investor agreement | 10 investor validations |
| **Code Duplication** | <5% | CodeClimate or SonarQube |
| **Type Safety** | 100% (zero `any` types) | TypeScript strict mode |
| **Performance** | <500ms decision generation | Performance testing |

---

## 🎓 LESSONS FROM SPRINT 1

### **What Went Well** ✅

1. Polymorphic inheritance for `BasePropertyAnalyzer` → `SFRAnalyzer` | `MultiFamilyAnalyzer`
2. Generic type `<T extends CommonMetrics>` enforced type safety
3. Abstract methods forced subclass implementation
4. Zero SFR regressions (100% test pass rate)

### **Apply to Sprint 2**

- Use same polymorphic pattern for Decision Engine
- Follow same naming conventions (Base → SFR/MF subclasses)
- Keep abstract method count low (4 methods, not 10)
- Comprehensive testing at each story boundary

---

## 🚀 IMPLEMENTATION ORDER

### **Week 1** (40 hours)

**Days 1-3**: Story 2.1 - Extract BaseDecisionEngine (24h)
- Extract common methods to base class
- Define 4 abstract methods
- Compile and validate type safety

**Days 4-5**: Story 2.2 - Create SFRDecisionEngine (16h)
- Implement SFR-specific methods
- Run all SFR tests (must be 100% passing)

### **Week 2** (40 hours)

**Days 6-7**: Story 2.3 - Create MFDecisionEngine (16h)
- Implement MF-specific methods
- Write MF decision engine tests
- Validate cap rate/DSCR scoring

**Days 8-10**: Story 2.4 - Integration & Testing (24h)
- Wire up controllers
- Integration testing
- Business Expert validation
- Performance testing

---

## 📋 HANDOFF TO QE ENGINEER

**QE Review Required**:
- [ ] Test strategy review (comprehensive?)
- [ ] Edge case identification (what could break?)
- [ ] Performance testing requirements
- [ ] Regression test coverage
- [ ] MF-specific test scenarios

**QE Concerns to Address**:
1. How to test walk-away price accuracy?
2. What are edge cases for DSCR scoring?
3. How to prevent SFR regressions?
4. Integration test coverage sufficient?

---

**Architect Signature**: ✅ Architecture Plan Complete
**Status**: Ready for QE Engineer Review
**Next**: QE Engineer validates testing strategy

---

**Document Version**: 1.0
**Last Updated**: October 29, 2025
**Architect**: Principal Software Architect (18 years, Amazon/Redfin)
