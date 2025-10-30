# Sprint 2: QE Engineer Review - Investment Decision Engine

**Review Date**: October 29, 2025
**QE Engineer**: Senior QE (20 years, AWS/Zillow/Fintech)
**Architecture Plan**: SPRINT_2_ARCHITECTURE_PLAN.md
**Review Focus**: Testability, Edge Cases, Regression Risk

---

## 📊 OVERALL ASSESSMENT

**QE Rating**: ⭐⭐⭐⭐⭐ (5/5) - EXCELLENT ARCHITECTURE

**Summary**: Architect has created a well-thought-out refactoring plan with clear polymorphic inheritance, strong type safety, and excellent attention to backward compatibility. The 4-story breakdown is testable at each boundary.

**Recommendation**: ✅ **APPROVED FOR IMPLEMENTATION**

However, I have identified **10 critical test scenarios** and **3 high-risk areas** that MUST be addressed during implementation.

---

## ✅ STRENGTHS OF THIS PLAN

1. **Incremental Refactoring** ✅
   Breaking 3,546-line monolith into 4 testable stories reduces risk. Each story can be tested independently before moving to next.

2. **Backward Compatibility** ✅
   Keeping old `InvestmentDecisionEngine` as delegation wrapper is smart. Gives us 1 sprint to validate new engines before full cutover.

3. **Type Safety** ✅
   Generic `<T extends CommonMetrics>` enforces compile-time validation. Impossible to pass `SFRData` to `MFDecisionEngine` (compiler error).

4. **Clear Abstract Methods** ✅
   Only 4 abstract methods keeps subclass implementation focused. Each abstract method has clear business purpose.

5. **Zero SFR Regression Tolerance** ✅
   100% SFR test pass rate requirement is non-negotiable and correct.

---

## ⚠️ CRITICAL TEST SCENARIOS (MUST IMPLEMENT)

### **SCENARIO 1: Scoring Weight Validation**

**Test**: Verify scoring weights sum to 1.0 (100%)

```typescript
describe('BaseDecisionEngine - Scoring Weights', () => {
  it('SFR weights should sum to 1.0', () => {
    const sfrEngine = new SFRDecisionEngine(...);
    const weights = sfrEngine.getScoringWeights();

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10); // Precision to 10 decimal places
  });

  it('MF weights should sum to 1.0', () => {
    const mfEngine = new MFDecisionEngine(...);
    const weights = mfEngine.getScoringWeights();

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});
```

**Why Critical**: If weights don't sum to 1.0, deal quality scores will be inflated/deflated. Example: If sum = 1.05, max score is 105/100.

---

### **SCENARIO 2: Walk-Away Price Edge Cases**

**Test**: MF walk-away price with zero or negative NOI

```typescript
describe('MFDecisionEngine - Walk-Away Price', () => {
  it('should return $0 walk-away when NOI is zero', () => {
    const propertyWithZeroNOI = { ...mfProperty, noi: 0 };
    const engine = new MFDecisionEngine(...);

    const walkAway = engine.calculateWalkAwayPrice();
    expect(walkAway).toBe(0);
  });

  it('should return $0 walk-away when NOI is negative', () => {
    const propertyWithNegativeNOI = { ...mfProperty, noi: -10000 };
    const engine = new MFDecisionEngine(...);

    const walkAway = engine.calculateWalkAwayPrice();
    expect(walkAway).toBe(0); // Negative walk-away makes no sense
  });

  it('should handle Dallas A-Class low cap rates (4%)', () => {
    const targetCapRate = 0.04; // Dallas A-Class
    const noi = 50000;
    const expectedWalkAway = 50000 / 0.04; // $1,250,000

    const walkAway = engine.calculateWalkAwayPrice();
    expect(walkAway).toBeCloseTo(expectedWalkAway, -1000);
  });
});
```

**Why Critical**: Divide-by-zero or negative NOI could crash the engine.

---

### **SCENARIO 3: DSCR Scoring Boundary Testing**

**Test**: DSCR scoring at critical thresholds (1.25, 1.35, 1.50)

```typescript
describe('MFDecisionEngine - DSCR Scoring', () => {
  const testCases = [
    { dscr: 1.50, expectedScore: 100, description: 'Excellent (1.50)' },
    { dscr: 1.35, expectedScore: 90, description: 'Very good (1.35)' },
    { dscr: 1.25, expectedScore: 75, description: 'Good (1.25 - lender minimum)' },
    { dscr: 1.24, expectedScore: 50, description: 'Borderline (1.24 - just below)' },
    { dscr: 1.00, expectedScore: 25, description: 'Poor (1.00 - breakeven)' },
    { dscr: 0.99, expectedScore: 0, description: 'Failing (0.99 - underwater)' },
  ];

  testCases.forEach(({ dscr, expectedScore, description }) => {
    it(`should score ${description}`, () => {
      const engine = new MFDecisionEngine(...);
      const scores = engine.scoreProperty();

      expect(scores.dscrScore).toBe(expectedScore);
    });
  });

  it('should flag DSCR < 1.25 as CRITICAL risk', () => {
    const propertyWithLowDSCR = { ...mfProperty, dscr: 1.20 };
    const engine = new MFDecisionEngine(...);

    const risks = engine.getPropertyTypeSpecificRisks();
    expect(risks).toContainEqual(expect.stringContaining('CRITICAL'));
    expect(risks).toContainEqual(expect.stringContaining('DSCR'));
  });
});
```

**Why Critical**: DSCR = 1.25 is hard cutoff for most commercial lenders. One basis point difference (1.24 vs 1.25) = loan approval or rejection.

---

### **SCENARIO 4: SFR Regression Testing (MOST CRITICAL)**

**Test**: Every existing SFR test must pass with new engine

```typescript
describe('SFRDecisionEngine - Regression Tests', () => {
  // Use EXACT same test data from existing tests
  const existingSFRTests = [
    'Anna TX aggressive investor',
    'Fayetteville 4-plex',
    'Austin 8-plex',
    'Negative cash flow scenario',
    'All-cash purchase',
    // ... all 73 existing tests
  ];

  existingSFRTests.forEach((testName) => {
    it(`should produce identical results for: ${testName}`, () => {
      // Old engine
      const oldEngine = new InvestmentDecisionEngine();
      const oldResult = oldEngine.generateDecision(...);

      // New engine
      const newEngine = new SFRDecisionEngine(...);
      const newResult = newEngine.generateDecision(...);

      // Compare EVERY field
      expect(newResult.verdict).toBe(oldResult.verdict);
      expect(newResult.professionalAssessment.dealQuality)
        .toBeCloseTo(oldResult.professionalAssessment.dealQuality, 1);
      expect(newResult.actionPlan).toEqual(oldResult.actionPlan);
      // ... compare all fields
    });
  });
});
```

**Why Critical**: ANY regression breaks existing user workflows. User sees different verdict for same property = loss of trust.

---

### **SCENARIO 5: Cap Rate Scoring Differentiation (SFR vs MF)**

**Test**: Verify cap rate scores differently for SFR vs MF

```typescript
describe('Cap Rate Scoring - SFR vs MF Differentiation', () => {
  const capRate = 6.5;

  it('SFR should score cap rate with LOW weight (3%)', () => {
    const sfrEngine = new SFRDecisionEngine(...);
    const assessment = sfrEngine.calculateProfessionalAssessment();

    const capRateContribution = assessment.capRateScore * 0.03;
    expect(capRateContribution).toBeLessThan(5); // Max 3 points
  });

  it('MF should score cap rate with HIGH weight (25%)', () => {
    const mfEngine = new MFDecisionEngine(...);
    const assessment = mfEngine.calculateProfessionalAssessment();

    const capRateContribution = assessment.capRateScore * 0.25;
    expect(capRateContribution).toBeGreaterThan(15); // Min 15 points likely
  });

  it('same cap rate should result in different deal quality', () => {
    const sfrQuality = sfrEngine.calculateProfessionalAssessment().dealQuality;
    const mfQuality = mfEngine.calculateProfessionalAssessment().dealQuality;

    expect(Math.abs(sfrQuality - mfQuality)).toBeGreaterThan(10);
    // SFR and MF with same metrics should score differently
  });
});
```

**Why Critical**: This IS the business value of Sprint 2. If scoring isn't different, refactor provides no value.

---

### **SCENARIO 6: Verdict Consistency (BUY/NEGOTIATE/CAUTION/PASS)**

**Test**: Verify verdicts at score boundaries

```typescript
describe('Verdict Determination', () => {
  const testCases = [
    { dealQuality: 75, expectedVerdict: 'BUY' },
    { dealQuality: 74, expectedVerdict: 'NEGOTIATE' },
    { dealQuality: 65, expectedVerdict: 'NEGOTIATE' },
    { dealQuality: 64, expectedVerdict: 'CAUTION' },
    { dealQuality: 50, expectedVerdict: 'CAUTION' },
    { dealQuality: 49, expectedVerdict: 'PASS' },
  ];

  testCases.forEach(({ dealQuality, expectedVerdict }) => {
    it(`should return ${expectedVerdict} for score ${dealQuality}`, () => {
      const verdict = engine.determineVerdict(dealQuality);
      expect(verdict).toBe(expectedVerdict);
    });
  });
});
```

**Why Critical**: Verdict boundaries are user-facing decisions. Score of 74 vs 75 = "BUY" vs "NEGOTIATE" = different user action.

---

### **SCENARIO 7: Market-Adjusted Cap Rate Targets**

**Test**: Verify target cap rates adjust by market tier

```typescript
describe('MFDecisionEngine - Market-Adjusted Cap Rates', () => {
  it('should use 5% target for A-Class markets (Dallas)', () => {
    const dallasProperty = { ...mfProperty, marketTier: 'A' };
    const engine = new MFDecisionEngine(...);

    const targetCapRate = engine.getTargetCapRate();
    expect(targetCapRate).toBe(0.05); // 5% for A-Class
  });

  it('should use 7.5% target for B-Class markets', () => {
    const secondaryMarket = { ...mfProperty, marketTier: 'B' };
    const engine = new MFDecisionEngine(...);

    const targetCapRate = engine.getTargetCapRate();
    expect(targetCapRate).toBe(0.075); // 7.5% for B-Class
  });

  it('should use 10% target for C-Class markets', () => {
    const tertiaryMarket = { ...mfProperty, marketTier: 'C' };
    const engine = new MFDecisionEngine(...);

    const targetCapRate = engine.getTargetCapRate();
    expect(targetCapRate).toBe(0.10); // 10% for C-Class
  });
});
```

**Why Critical**: Dallas A-Class investor expecting 5% cap rate should not get same walk-away price as Memphis C-Class investor expecting 10%.

---

### **SCENARIO 8: Integration Test (Analyzer → Engine → Decision)**

**Test**: End-to-end flow from property data to decision

```typescript
describe('Integration: MF Analyzer → MF Engine → Decision', () => {
  it('should generate complete decision from raw property data', async () => {
    // Step 1: Create analyzer with raw MF property data
    const propertyData: MultiFamilyData = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(propertyData, assumptions);

    // Step 2: Run analysis
    const analysis = await analyzer.analyzeWithMarketIntelligence();

    // Step 3: Create decision engine
    const engine = new MFDecisionEngine(
      analysis,
      propertyData,
      analysis.marketData
    );

    // Step 4: Generate decision
    const decision = engine.generateDecision();

    // Validate complete decision structure
    expect(decision.verdict).toBeOneOf(['BUY', 'NEGOTIATE', 'CAUTION', 'PASS']);
    expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(0);
    expect(decision.professionalAssessment.dealQuality).toBeLessThanOrEqual(100);
    expect(decision.actionPlan).toBeArray();
    expect(decision.capitalStrategy).toBeDefined();
  });
});
```

**Why Critical**: Individual unit tests can pass but integration can fail. End-to-end testing catches integration bugs.

---

### **SCENARIO 9: Performance Testing**

**Test**: Ensure decision generation completes in < 500ms

```typescript
describe('Performance - Decision Generation', () => {
  it('SFR decision should complete in < 500ms', async () => {
    const startTime = performance.now();

    const engine = new SFRDecisionEngine(...);
    const decision = await engine.generateDecision();

    const elapsedTime = performance.now() - startTime;
    expect(elapsedTime).toBeLessThan(500); // 500ms target
  });

  it('MF decision should complete in < 500ms', async () => {
    const startTime = performance.now();

    const engine = new MFDecisionEngine(...);
    const decision = await engine.generateDecision();

    const elapsedTime = performance.now() - startTime;
    expect(elapsedTime).toBeLessThan(500);
  });
});
```

**Why Critical**: Slow decision generation = poor user experience. Target: < 500ms for 95th percentile.

---

### **SCENARIO 10: Type Safety (Property Type Mismatch)**

**Test**: Ensure TypeScript prevents property type mismatch

```typescript
describe('Type Safety - Property Type Mismatch', () => {
  it('should not compile: SFRData → MFDecisionEngine', () => {
    const sfrData: SFRData = { ... };

    // @ts-expect-error - Should fail TypeScript compilation
    const engine = new MFDecisionEngine(
      analysis,
      sfrData, // ← WRONG TYPE
      marketData
    );
  });

  it('should not compile: MultiFamilyData → SFRDecisionEngine', () => {
    const mfData: MultiFamilyData = { ... };

    // @ts-expect-error - Should fail TypeScript compilation
    const engine = new SFRDecisionEngine(
      analysis,
      mfData, // ← WRONG TYPE
      marketData
    );
  });
});
```

**Why Critical**: Runtime property type mismatch = undefined behavior. TypeScript generic should prevent this at compile time.

---

## 🚨 HIGH-RISK AREAS (ARCHITECT MUST ADDRESS)

### **RISK 1: Abstract Method Contract Violation**

**Issue**: What if subclass returns invalid data from abstract method?

**Example**:
```typescript
// Subclass could return invalid scoring weights
protected getScoringWeights(): ScoringWeights {
  return {
    cashFlow: 0.50,
    irr: 0.50,
    // ... sum = 2.0 instead of 1.0 ❌
  };
}
```

**Mitigation**: Add validation in base class:

```typescript
protected validateScoringWeights(weights: ScoringWeights): void {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.0001) {
    throw new Error(
      `Scoring weights must sum to 1.0, got ${sum.toFixed(4)}`
    );
  }
}
```

---

### **RISK 2: Type Narrowing in Base Class**

**Issue**: Base class accepts `SFRData | MultiFamilyData` union type. How does base class access property-type-specific fields?

**Example**:
```typescript
// In base class - how to access totalUnits (MF-only field)?
protected someCommonMethod() {
  const units = this.propertyData.totalUnits; // ❌ Type error
}
```

**Mitigation**:
1. Base class should ONLY access common fields (purchasePrice, etc.)
2. Property-type-specific logic goes in subclass methods
3. Use type guards if base class needs property-type-specific logic:

```typescript
protected isMultiFamily(): boolean {
  return this.propertyData.propertyType === 'Multi-Family';
}
```

---

### **RISK 3: Backward Compatibility Delegation**

**Issue**: Old `InvestmentDecisionEngine` delegates to new `SFRDecisionEngine`. What if API changes subtly break existing code?

**Mitigation**: Keep old class API IDENTICAL for 1 sprint:

```typescript
export class InvestmentDecisionEngine {
  generateDecision(
    analysis: any,
    propertyData: SFRData,
    marketData?: MarketDataResponse
  ): InvestmentDecision {
    // Create new engine with SAME arguments
    const engine = new SFRDecisionEngine(
      analysis,
      propertyData,
      marketData,
      undefined // userGoals
    );
    return engine.generateDecision();
  }
}
```

---

## ✅ QE RECOMMENDATIONS

### **RECOMMENDATION 1: Test-First Implementation**

Write tests BEFORE implementing each story:

- **Story 2.1**: Write base class tests first → Implement base class
- **Story 2.2**: Write SFR engine tests first → Implement SFR engine
- **Story 2.3**: Write MF engine tests first → Implement MF engine
- **Story 2.4**: Write integration tests first → Wire up controllers

**Why**: Test-first catches API design issues before code is written.

---

### **RECOMMENDATION 2: Continuous Regression Testing**

After EACH story completion:
- [ ] Run full SFR test suite (73 tests)
- [ ] Run full MF test suite (73 tests)
- [ ] Fix any regressions immediately

**Do NOT proceed to next story if ANY test fails.**

---

### **RECOMMENDATION 3: Business Expert Validation (Story 2.3)**

After MFDecisionEngine implementation:
- [ ] Run 5 real MF properties through engine
- [ ] Compare walk-away prices to Business Expert manual calculations
- [ ] Validate DSCR scoring against commercial lending standards
- [ ] Confirm cap rate weighting (25%) produces reasonable verdicts

**Success Criteria**: 90%+ agreement with Business Expert valuations

---

### **RECOMMENDATION 4: Test Coverage Target**

**Minimum Coverage**:
- BaseDecisionEngine: 95% coverage (core logic, high risk)
- SFRDecisionEngine: 90% coverage (regression risk)
- MFDecisionEngine: 90% coverage (new functionality)

**How to Measure**:
```bash
npm test -- --coverage
```

---

## 📋 QE SIGN-OFF CHECKLIST

Before Engineer begins implementation:

- [x] Architecture plan reviewed ✅
- [x] 10 critical test scenarios identified ✅
- [x] 3 high-risk areas documented ✅
- [x] Test-first approach recommended ✅
- [x] Regression testing strategy defined ✅
- [ ] Test files scaffolded (Engineer to do)
- [ ] Test data fixtures created (Engineer to do)

---

## ✅ FINAL QE VERDICT

**Rating**: ⭐⭐⭐⭐⭐ (5/5) - EXCELLENT

**Status**: ✅ **APPROVED FOR IMPLEMENTATION**

**Confidence**: HIGH - Plan is testable, incremental, and comprehensive

**Estimated Test Effort**:
- Story 2.1: 8 hours (base class tests)
- Story 2.2: 6 hours (SFR engine tests)
- Story 2.3: 8 hours (MF engine tests)
- Story 2.4: 10 hours (integration tests)
- **Total**: 32 hours testing (40% of 80-hour sprint) ✅ REASONABLE

**Next Step**: Hand off to Full Stack Engineer for implementation

---

**QE Engineer Signature**: ✅ Review Complete
**Review Date**: October 29, 2025
**Recommendation**: BEGIN SPRINT 2 IMPLEMENTATION
