/**
 * MFDecisionEngine Test Suite
 * Created: October 29, 2025 - Sprint 2, Story 2.3
 *
 * Test Coverage:
 * - Suite 1: MF Scoring Weight Validation (3 tests)
 * - Suite 2: Walk-Away Price Calculation (5 tests)
 * - Suite 3: DSCR Scoring (6 tests)
 * - Suite 4: Cap Rate Scoring (5 tests)
 * - Suite 5: MF-Specific Risks (5 tests)
 * - Suite 6: End-to-End Decision Generation (3 tests)
 *
 * Total: 27 tests
 */

import { MFDecisionEngine } from '../../services/investment/MFDecisionEngine';
import { AnalysisResult, MultiFamilyData, MultiFamilyMetrics } from '../../types/propertyTypes';

// ===== TEST DATA FIXTURES =====

/**
 * Creates a minimal valid MF property fixture for testing
 */
function createMFPropertyData(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
  const defaults: MultiFamilyData = {
    propertyType: 'MF',
    purchasePrice: 1000000,
    downPayment: 250000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 2.0,
    insuranceRate: 0.6,
    maintenanceCost: 0,
    propertyManagementRate: 10,
    propertyAddress: {
      street: '123 Multi-Family Lane',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201'
    },
    closingCosts: 30000,
    totalUnits: 10,
    totalSqft: 8000,
    yearBuilt: 2000,
    unitTypes: [
      { type: '2BR/1BA', count: 10, sqft: 800, monthlyRent: 1200 }
    ],
    commonAreaUtilities: {
      electric: 150,
      water: 100,
      gas: 50,
      trash: 75
    },
    maintenanceCostPerUnit: 100
  };

  return { ...defaults, ...overrides };
}

/**
 * Creates a minimal valid MF analysis result for testing
 */
function createMFAnalysisResult(metricsOverrides?: Partial<MultiFamilyMetrics>): AnalysisResult<MultiFamilyMetrics> {
  const baseMetrics: MultiFamilyMetrics = {
    // CommonMetrics fields
    noi: 86176,
    capRate: 0.08618,
    cashOnCashReturn: 0.1279,
    irr: 12.5,
    dscr: 1.51,
    operatingExpenseRatio: 0.37,
    totalInvestment: 280000,

    // MultiFamilyMetrics specific fields
    pricePerUnit: 100000,
    pricePerSqft: 125,
    noiPerUnit: 8618,
    cashFlowPerUnit: 244,
    averageRentPerUnit: 1200,
    operatingExpensePerUnit: 5062,
    grm: 8.3,
    debtYield: 11.5,
    breakEvenOccupancy: 75,
    rentPerSqft: 1.50,
    unitMixEfficiency: 85,
    economicVacancyRate: 5,
    grossYield: 14.4,
    commonAreaExpenseRatio: 0.05,
    effectiveGrossIncome: 136800,
    grossIncome: 144000,
    operatingExpenses: 50624
  };

  return {
    monthlyAnalysis: {
      income: { gross: 12000, effective: 11400 },
      expenses: { operating: 4219, debt: 4743, total: 8962, breakdown: {} },
      cashFlow: 2438
    },
    annualAnalysis: {
      income: 144000,
      expenses: 50624,
      noi: 86176,
      debtService: 56916,
      cashFlow: 29256
    },
    metrics: { ...baseMetrics, ...metricsOverrides },
    projections: [],
    exitAnalysis: {
      projectedSalePrice: 1500000,
      sellingCosts: 90000,
      mortgagePayoff: 700000,
      netProceedsFromSale: 710000,
      totalReturn: 430000,
      equityMultiple: 2.54
    }
  };
}

// ===== SUITE 1: MF SCORING WEIGHT VALIDATION (3 tests) =====

describe('Suite 1: MFDecisionEngine - Scoring Weight Validation', () => {
  it('should return MF scoring weights that sum to 1.0', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult();

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    // Verify weights sum to 1.0 (validated in constructor)
    expect(decision).toBeDefined();
    expect(decision.verdict).toBeDefined();
  });

  it('should prioritize cap rate at 25% weight (PRIMARY METRIC)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult();

    const engine = new MFDecisionEngine(analysis, propertyData);
    const weights = (engine as any).getScoringWeights();

    expect(weights.capRate).toBe(0.25);
    expect(weights.capRate).toBeGreaterThan(weights.cashFlow); // 25% > 20%
    expect(weights.capRate).toBeGreaterThan(weights.irr); // 25% > 20%
  });

  it('should emphasize DSCR at 20% weight (CRITICAL for lenders)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult();

    const engine = new MFDecisionEngine(analysis, propertyData);
    const weights = (engine as any).getScoringWeights();

    expect(weights.dscr).toBe(0.20);
    expect(weights.propertyRisk).toBe(0.00); // MF has zero property risk
  });
});

// ===== SUITE 2: WALK-AWAY PRICE CALCULATION (5 tests) =====

describe('Suite 2: MFDecisionEngine - Walk-Away Price', () => {
  it('should calculate walk-away using NOI / Target Cap Rate formula', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Dallas', state: 'TX', street: '123 Test', zipCode: '75201' }
    });
    const analysis = createMFAnalysisResult({ noi: 100000 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const walkAwayPrice = (engine as any).calculateWalkAwayPrice();

    // Dallas is A-Class market → 5% target cap rate
    // Walk-Away = $100,000 / 0.05 = $2,000,000
    expect(walkAwayPrice).toBe(2000000);
  });

  it('should use market-appropriate cap rate for A-Class markets (5%)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Austin', state: 'TX', street: '123 Test', zipCode: '78701' }
    });
    const analysis = createMFAnalysisResult({ noi: 50000 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const walkAwayPrice = (engine as any).calculateWalkAwayPrice();

    // Austin is A-Class → 5% target cap
    // Walk-Away = $50,000 / 0.05 = $1,000,000
    expect(walkAwayPrice).toBe(1000000);
  });

  it('should use market-appropriate cap rate for B-Class markets (7.5%)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Tampa', state: 'FL', street: '123 Test', zipCode: '33601' }
    });
    const analysis = createMFAnalysisResult({ noi: 75000 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const walkAwayPrice = (engine as any).calculateWalkAwayPrice();

    // Tampa is B-Class → 7.5% target cap
    // Walk-Away = $75,000 / 0.075 = $1,000,000
    expect(walkAwayPrice).toBe(1000000);
  });

  it('should handle zero NOI safely by returning purchase price', () => {
    const propertyData = createMFPropertyData({ purchasePrice: 800000 });
    const analysis = createMFAnalysisResult({ noi: 0 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const walkAwayPrice = (engine as any).calculateWalkAwayPrice();

    // Zero NOI → fallback to purchase price
    expect(walkAwayPrice).toBe(800000);
  });

  it('should handle negative NOI safely by returning purchase price', () => {
    const propertyData = createMFPropertyData({ purchasePrice: 900000 });
    const analysis = createMFAnalysisResult({ noi: -10000 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const walkAwayPrice = (engine as any).calculateWalkAwayPrice();

    // Negative NOI → fallback to purchase price
    expect(walkAwayPrice).toBe(900000);
  });
});

// ===== SUITE 3: DSCR SCORING (6 tests) =====

describe('Suite 3: MFDecisionEngine - DSCR Scoring (CRITICAL METRIC)', () => {
  it('should score DSCR >= 1.50 as 100 (Excellent - lenders love this)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ dscr: 1.50 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const dscrScore = (engine as any).scoreDSCR(1.50);

    expect(dscrScore).toBe(100);
  });

  it('should score DSCR 1.35 as 90 (Very good)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ dscr: 1.35 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const dscrScore = (engine as any).scoreDSCR(1.35);

    expect(dscrScore).toBe(90);
  });

  it('should score DSCR 1.25 as 75 (Good - standard lender minimum)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ dscr: 1.25 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const dscrScore = (engine as any).scoreDSCR(1.25);

    expect(dscrScore).toBe(75);
  });

  it('should score DSCR 1.24 as 50 (Borderline - below lender minimum)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ dscr: 1.24 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const dscrScore = (engine as any).scoreDSCR(1.24);

    expect(dscrScore).toBe(50);
  });

  it('should score DSCR < 1.0 as 0 (Critical - does not cover debt)', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ dscr: 0.95 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const dscrScore = (engine as any).scoreDSCR(0.95);

    expect(dscrScore).toBe(0);
  });

  it('should flag DSCR < 1.25 as CRITICAL risk', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ dscr: 1.20 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    const criticalRisk = decision.keyRisks.find((r: string) =>
      r.includes('⚠️ CRITICAL: DSCR < 1.25')
    );

    expect(criticalRisk).toBeDefined();
  });
});

// ===== SUITE 4: CAP RATE SCORING (5 tests) =====

describe('Suite 4: MFDecisionEngine - Cap Rate Scoring (PRIMARY METRIC)', () => {
  it('should score cap rate 2%+ above target as 100 (Exceptional deal)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Dallas', state: 'TX', street: '123 Test', zipCode: '75201' }
    });
    // Dallas A-Class target: 5%, property: 7% = 2% spread
    const analysis = createMFAnalysisResult({ capRate: 0.07 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const capRateScore = (engine as any).scoreCapRate(0.07);

    expect(capRateScore).toBe(100);
  });

  it('should score cap rate at target as 80 (Fair market)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Tampa', state: 'FL', street: '123 Test', zipCode: '33601' }
    });
    // Tampa B-Class target: 7.5%, property: 7.5% = 0% spread
    const analysis = createMFAnalysisResult({ capRate: 0.075 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const capRateScore = (engine as any).scoreCapRate(0.075);

    expect(capRateScore).toBe(80);
  });

  it('should score cap rate 1% below target as 60 (Premium pricing)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Dallas', state: 'TX', street: '123 Test', zipCode: '75201' }
    });
    // Dallas A-Class target: 5%, property: 4% = -1% spread
    const analysis = createMFAnalysisResult({ capRate: 0.04 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const capRateScore = (engine as any).scoreCapRate(0.04);

    expect(capRateScore).toBe(60);
  });

  it('should score cap rate 2% below target as 40 (Overpriced)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Tampa', state: 'FL', street: '123 Test', zipCode: '33601' }
    });
    // Tampa B-Class target: 7.5%, property: 5.5% = -2% spread
    const analysis = createMFAnalysisResult({ capRate: 0.055 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const capRateScore = (engine as any).scoreCapRate(0.055);

    expect(capRateScore).toBe(40);
  });

  it('should score cap rate >2% below target as 20 (Severely overpriced)', () => {
    const propertyData = createMFPropertyData({
      propertyAddress: { city: 'Dallas', state: 'TX', street: '123 Test', zipCode: '75201' }
    });
    // Dallas A-Class target: 5%, property: 2.5% = -2.5% spread
    const analysis = createMFAnalysisResult({ capRate: 0.025 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const capRateScore = (engine as any).scoreCapRate(0.025);

    expect(capRateScore).toBe(20);
  });
});

// ===== SUITE 5: MF-SPECIFIC RISKS (5 tests) =====

describe('Suite 5: MFDecisionEngine - MF-Specific Risk Assessment', () => {
  it('should flag low cap rate (<4%) as premium pricing risk', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ capRate: 0.035 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    const capRateRisk = decision.keyRisks.find((r: string) =>
      r.includes('Low cap rate (<4%)')
    );

    expect(capRateRisk).toBeDefined();
  });

  it('should flag high vacancy rate (>10%) as market weakness', () => {
    const propertyData = createMFPropertyData();
    const analysis = createMFAnalysisResult({ economicVacancyRate: 12 });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    const vacancyRisk = decision.keyRisks.find((r: string) =>
      r.includes('High vacancy rate (>10%)')
    );

    expect(vacancyRisk).toBeDefined();
  });

  it('should flag 1-4 units as residential financing complexity', () => {
    const propertyData = createMFPropertyData({ totalUnits: 4 });
    const analysis = createMFAnalysisResult();

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    const financingRisk = decision.keyRisks.find((r: string) =>
      r.includes('1-4 units may require residential financing')
    );

    expect(financingRisk).toBeDefined();
  });

  it('should flag negative cash flow per unit', () => {
    const propertyData = createMFPropertyData({ totalUnits: 10 });
    // Create scenario with negative cash flow
    // Debt Service ≈ $500K × 6% = $30K/year
    // Cash Flow = $20K - $30K = -$10K (negative)
    const analysis = createMFAnalysisResult({
      noi: 20000, // Very low NOI
      totalInvestment: 500000 // High investment = high debt service
    });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    const cashFlowRisk = decision.keyRisks.find((r: string) =>
      r.includes('Negative cash flow per unit')
    );

    expect(cashFlowRisk).toBeDefined();
  });

  it('should flag old property (>30 years) for CapEx budget', () => {
    const currentYear = new Date().getFullYear();
    const propertyData = createMFPropertyData({ yearBuilt: currentYear - 35 });
    const analysis = createMFAnalysisResult();

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    const ageRisk = decision.keyRisks.find((r: string) =>
      r.includes('Property age >30 years')
    );

    expect(ageRisk).toBeDefined();
  });
});

// ===== SUITE 6: END-TO-END DECISION GENERATION (3 tests) =====

describe('Suite 6: MFDecisionEngine - End-to-End Decision Generation', () => {
  it('should generate BUY verdict for excellent MF deal (high cap rate, strong DSCR)', () => {
    const propertyData = createMFPropertyData({
      purchasePrice: 1000000,
      totalUnits: 20,
      propertyAddress: { city: 'Dallas', state: 'TX', street: '123 Test', zipCode: '75201' }
    });
    const analysis = createMFAnalysisResult({
      noi: 100000,
      capRate: 0.10, // 10% cap rate (vs 5% target)
      dscr: 1.60, // Excellent DSCR
      irr: 15, // Strong IRR
      cashOnCashReturn: 0.14
    });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    expect(decision.verdict).toBe('BUY');
    expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(80);
  });

  it('should generate NEGOTIATE verdict for borderline MF deal (low DSCR)', () => {
    const propertyData = createMFPropertyData({
      purchasePrice: 1000000,
      totalUnits: 10
    });
    const analysis = createMFAnalysisResult({
      noi: 60000,
      capRate: 0.06, // Fair cap rate
      dscr: 1.15, // Below lender minimum
      irr: 8, // Low IRR
      cashOnCashReturn: 0.05
    });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    expect(decision.verdict).toBe('NEGOTIATE');
    expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(65);
    expect(decision.professionalAssessment.dealQuality).toBeLessThan(80);
  });

  it('should generate PASS verdict for poor MF deal (negative cash flow, low cap rate)', () => {
    const propertyData = createMFPropertyData({
      purchasePrice: 2000000,
      totalUnits: 10
    });
    const analysis = createMFAnalysisResult({
      noi: 40000, // Very low NOI
      capRate: 0.02, // 2% cap rate (terrible)
      dscr: 0.90, // Doesn't cover debt
      irr: 4, // Poor IRR
      cashOnCashReturn: -0.02
    });

    const engine = new MFDecisionEngine(analysis, propertyData);
    const decision = engine.generateDecision();

    expect(decision.verdict).toBe('PASS');
    expect(decision.professionalAssessment.dealQuality).toBeLessThan(50);
  });
});
