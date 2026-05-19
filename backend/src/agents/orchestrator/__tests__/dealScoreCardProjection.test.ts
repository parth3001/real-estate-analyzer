/**
 * dealScoreCardProjection unit tests — W6-S4.
 *
 * Pure-function tests; no DB. Verifies the projection from
 * (AnalysisPayload, DecisionPayload) → DealScoreCard wire shape
 * matches the frontend DealScoreCard component's props 1:1.
 */

import { Types } from 'mongoose';
import {
  projectDealScoreCard,
  gateCardForAnonymous,
} from '../dealScoreCardProjection';
import type { AnalysisPayload } from '../../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';
import type { SFRData } from '../../../types/propertyTypes';
import type {
  ProfessionalAssessment,
  MarketPosition,
} from '../../../services/investment/BaseDecisionEngine';

function fakeProfessionalAssessment(
  scores: Partial<ProfessionalAssessment> = {}
): ProfessionalAssessment {
  return {
    dealQuality: 75,
    executionDifficulty: 40,
    dataReliability: 80,
    cashFlowScore: 88,
    irrScore: 70,
    marketStrengthScore: 65,
    debtStructureScore: 72,
    exitStrategyScore: 55,
    capRateScore: 60,
    propertyRiskScore: 45,
    primaryInsight: 'Strong cash flow profile; review market exposure.',
    strategicRecommendations: [
      'Make an offer at $385,000 with a 14-day inspection contingency.',
      'Lock the rate within 14 days to hedge upside.',
    ],
    riskMitigation: ['Maintain 6-month operating reserves.'],
    opportunityMaximization: [],
    confidenceLevel: 80,
    keyStrengths: ['Cash flow positive at current rents'],
    keyRisks: ['Submarket cap rate trending up'],
    ...scores,
  };
}

function fakeMarketPosition(
  overrides: Partial<MarketPosition> = {}
): MarketPosition {
  return {
    walkAwayPrice: 385000,
    pricingContext: 'fair',
    marketStage: 'mid',
    competitiveIntensity: 'moderate',
    ...overrides,
  };
}

function fakeDecision(
  overrides: Partial<DecisionPayload> = {}
): DecisionPayload {
  return {
    analysisEventId: new Types.ObjectId(),
    dealQuality: 78,
    qualityLabel: 'Meets professional standards' as DecisionPayload['qualityLabel'],
    qualityColor: 'yellow' as DecisionPayload['qualityColor'],
    professionalAssessment: fakeProfessionalAssessment(),
    marketPosition: fakeMarketPosition(),
    reasoningTrail: {
      primaryInsight: 'Strong cash flow; market exposure is the risk.',
      strategicRecommendations: [
        'Make an offer at $385,000 with a 14-day inspection contingency.',
      ],
      riskMitigation: ['Hold 6 months of reserves'],
      opportunityMaximization: [],
      keyRisks: ['Submarket softening'],
    },
    confidence: 80,
    scoringWeightsUsed: {} as DecisionPayload['scoringWeightsUsed'],
    engineVersion: 'v3.0',
    ...overrides,
  };
}

function fakeSFRData(overrides: Partial<SFRData> = {}): SFRData {
  return {
    propertyType: 'SFR',
    propertyAddress: {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409',
    },
    purchasePrice: 425000,
    downPayment: 106250,
    interestRate: 6.95,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 100,
    propertyManagementRate: 8,
    monthlyRent: 2800,
    squareFootage: 2200,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: 2015,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 3.5,
      inflationRate: 2.5,
      vacancyRate: 5,
      sellingCostsPercentage: 6,
    },
    ...overrides,
  };
}

function fakeAnalysis(
  property: SFRData,
  overrides: Partial<AnalysisPayload> = {}
): AnalysisPayload {
  return {
    propertyData: property,
    marketData: {} as AnalysisPayload['marketData'],
    assumptions: { vacancyRate: 5 },
    metrics: {} as AnalysisPayload['metrics'],
    monthlyAnalysis: {},
    longTermAnalysis: {},
    walkAwayPrice: 385000,
    enrichmentSource: 'fallback' as AnalysisPayload['enrichmentSource'],
    enrichmentCacheHit: false,
    engineVersion: 'v3.0',
    computeTimeMs: 100,
    ...overrides,
  };
}

describe('projectDealScoreCard', () => {
  it('produces the wire shape the frontend DealScoreCard expects', () => {
    const property = fakeSFRData();
    const analysis = fakeAnalysis(property);
    const decision = fakeDecision();

    const card = projectDealScoreCard(analysis, decision, 'buy_hold');

    expect(card).toMatchObject({
      strategy: 'buy_hold',
      address: { street: '1837 Walnut Way', city: 'Anna', state: 'TX' },
      dealQuality: 78,
      walkAwayPrice: 385000,
      purchasePrice: 425000,
    });
    expect(card.nextStep).toContain('Make an offer at $385,000');
  });

  describe('topFactors picking', () => {
    it('caps at 3 factors', () => {
      const decision = fakeDecision();
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        decision,
        'buy_hold'
      );
      expect(card.topFactors).toHaveLength(3);
    });

    it('prefers extremes (high AND low signal carries more than middling 50s)', () => {
      // Cash flow 100, Property risk 0, Cap rate 50 — first two should win
      const decision = fakeDecision({
        professionalAssessment: fakeProfessionalAssessment({
          cashFlowScore: 100,
          propertyRiskScore: 0,
          capRateScore: 50,
          irrScore: 50,
          marketStrengthScore: 50,
          debtStructureScore: 50,
          exitStrategyScore: 50,
        }),
      });
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        decision,
        'buy_hold'
      );
      const labels = card.topFactors.map((f) => f.label);
      expect(labels).toContain('Cash flow');
      expect(labels).toContain('Property risk');
    });

    it('rounds factor scores to integers', () => {
      const decision = fakeDecision({
        professionalAssessment: fakeProfessionalAssessment({
          cashFlowScore: 87.6,
          propertyRiskScore: 12.3,
        }),
      });
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        decision,
        'buy_hold'
      );
      for (const f of card.topFactors) {
        expect(Number.isInteger(f.score)).toBe(true);
      }
    });
  });

  describe('walkAwayPrice precedence', () => {
    it('prefers decision.marketPosition.walkAwayPrice over analysis.walkAwayPrice', () => {
      const decision = fakeDecision({
        marketPosition: fakeMarketPosition({ walkAwayPrice: 400000 }),
      });
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData(), { walkAwayPrice: 300000 }),
        decision,
        'buy_hold'
      );
      expect(card.walkAwayPrice).toBe(400000);
    });
  });

  describe('nextStep derivation', () => {
    it('uses the first strategic recommendation when present', () => {
      const decision = fakeDecision({
        reasoningTrail: {
          primaryInsight: 'Insight here.',
          strategicRecommendations: ['Pull comps from the last 90 days.'],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
      });
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        decision,
        'buy_hold'
      );
      expect(card.nextStep).toBe('Pull comps from the last 90 days.');
    });

    it('falls back to primaryInsight when no strategicRecommendations', () => {
      const decision = fakeDecision({
        reasoningTrail: {
          primaryInsight: 'Cash flow is the lever; rent feels light.',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
      });
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        decision,
        'buy_hold'
      );
      expect(card.nextStep).toBe('Cash flow is the lever; rent feels light.');
    });

    it('uses a safe fallback when both are missing', () => {
      const decision = fakeDecision({
        reasoningTrail: {
          primaryInsight: '',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
      });
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        decision,
        'buy_hold'
      );
      expect(card.nextStep).toMatch(/Review the assumptions/);
    });
  });

  describe('assumptions surfacing', () => {
    it('emits down-payment as percentage + dollar amount', () => {
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        fakeDecision(),
        'buy_hold'
      );
      const downPayment = card.assumptions.find((a) =>
        a.label.includes('down')
      );
      expect(downPayment?.label).toBe('25% down');
      expect(downPayment?.value).toBe('$106,250');
    });

    it('emits mortgage rate with provenance', () => {
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        fakeDecision(),
        'buy_hold'
      );
      const rate = card.assumptions.find((a) => a.label === 'Mortgage rate');
      // toFixed(1) on 6.95 rounds to "7.0" (banker's rounding behavior in V8)
      expect(rate?.value).toMatch(/^[67]\.\d%$/);
      expect(rate?.source).toBe('FRED 30yr avg');
    });

    it('handles decimal vs percentage defensively (0.05 → 5.0%)', () => {
      // Defensive check: if some upstream callsite passes 0.05 instead of 5,
      // the formatter still displays 5.0% not 0.0%. Mirrors the CLAUDE.md
      // historic decimal-vs-percentage bug.
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        fakeDecision(),
        'buy_hold'
      );
      const vacancy = card.assumptions.find((a) => a.label === 'Vacancy');
      expect(vacancy?.value).toBe('5.0%');
    });

    it('emits monthly rent on SFR with RentCast source', () => {
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        fakeDecision(),
        'buy_hold'
      );
      const rent = card.assumptions.find((a) => a.label === 'Monthly rent');
      expect(rent?.value).toBe('$2,800');
      expect(rent?.source).toBe('RentCast estimate');
    });
  });

  describe('input validation', () => {
    it('throws if propertyAddress is missing', () => {
      const property = fakeSFRData({
        propertyAddress: undefined as unknown as SFRData['propertyAddress'],
      });
      expect(() =>
        projectDealScoreCard(
          fakeAnalysis(property),
          fakeDecision(),
          'buy_hold'
        )
      ).toThrow(/propertyAddress is required/);
    });

    it('throws if dealQuality is non-finite', () => {
      const decision = fakeDecision({ dealQuality: NaN });
      expect(() =>
        projectDealScoreCard(
          fakeAnalysis(fakeSFRData()),
          decision,
          'buy_hold'
        )
      ).toThrow(/dealQuality is required/);
    });
  });

  it('preserves strategy in the output (brrrr vs buy_hold)', () => {
    const brrrr = projectDealScoreCard(
      fakeAnalysis(fakeSFRData()),
      fakeDecision(),
      'brrrr'
    );
    expect(brrrr.strategy).toBe('brrrr');
    const buyHold = projectDealScoreCard(
      fakeAnalysis(fakeSFRData()),
      fakeDecision(),
      'buy_hold'
    );
    expect(buyHold.strategy).toBe('buy_hold');
  });

  // ===== Issue #112: 10-year projection milestones =====

  describe('projection milestone sampling (Issue #112)', () => {
    function makeYearlyProjections() {
      // Build a 10-row projection. Each year has cashFlow growing 3%,
      // propertyValue growing 3.5%, equity buildup ~10%/yr from
      // amortization + appreciation.
      const rows = [];
      for (let y = 1; y <= 10; y++) {
        rows.push({
          year: y,
          propertyValue: Math.round(425000 * Math.pow(1.035, y)),
          grossIncome: 30000 * Math.pow(1.03, y),
          operatingExpenses: 12000,
          noi: 30000 * Math.pow(1.03, y) - 12000,
          debtService: 18000,
          cashFlow: Math.round(3000 * Math.pow(1.03, y - 1)),
          equity: Math.round(85000 + (y - 1) * 9500),
          mortgageBalance: 320000 - (y - 1) * 4000,
          totalReturn: 0,
        });
      }
      return rows;
    }

    it('samples the 5 milestone years (1/3/5/7/10) when present', () => {
      const analysis = fakeAnalysis(fakeSFRData(), {
        longTermAnalysis: {
          yearlyProjections: makeYearlyProjections(),
        } as AnalysisPayload['longTermAnalysis'],
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');

      expect(card.projection).toBeDefined();
      expect(card.projection).toHaveLength(5);
      expect(card.projection!.map((p) => p.year)).toEqual([1, 3, 5, 7, 10]);
      // Each row should have the three displayed metrics with finite numbers
      for (const row of card.projection!) {
        expect(Number.isFinite(row.cashFlow)).toBe(true);
        expect(Number.isFinite(row.propertyValue)).toBe(true);
        expect(Number.isFinite(row.equity)).toBe(true);
      }
    });

    it('omits the projection key when no yearlyProjections data is present', () => {
      // longTermAnalysis is {} in default fakeAnalysis — no projection
      const card = projectDealScoreCard(
        fakeAnalysis(fakeSFRData()),
        fakeDecision(),
        'buy_hold'
      );
      // The wire shape should not include a projection field at all so
      // the frontend hides the section cleanly.
      expect(card.projection).toBeUndefined();
    });

    it('omits the projection key when yearlyProjections is malformed (not an array)', () => {
      const analysis = fakeAnalysis(fakeSFRData(), {
        longTermAnalysis: {
          yearlyProjections: 'not an array' as unknown,
        } as AnalysisPayload['longTermAnalysis'],
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
      expect(card.projection).toBeUndefined();
    });

    it('skips milestone years that have NaN values (defensive)', () => {
      const rows = makeYearlyProjections();
      // Corrupt year 5 with NaN cashFlow — it should be skipped, but
      // years 1/3/7/10 still render
      rows[4] = { ...rows[4], cashFlow: NaN };
      const analysis = fakeAnalysis(fakeSFRData(), {
        longTermAnalysis: {
          yearlyProjections: rows,
        } as AnalysisPayload['longTermAnalysis'],
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
      expect(card.projection).toBeDefined();
      expect(card.projection!.map((p) => p.year)).toEqual([1, 3, 7, 10]);
    });
  });

  // ===== Day 11d — Key metrics block (Issue F) =====
  //
  // The actual financial numbers behind the score, surfaced into the
  // wire shape for the email + (eventually) the DealScoreCard UI.

  describe('keyMetrics block (Day 11d / Issue F)', () => {
    it('extracts numbers from analysis.metrics + analysis.monthlyAnalysis', () => {
      const analysis = fakeAnalysis(fakeSFRData(), {
        metrics: {
          noi: 18500,
          capRate: 5.2,
          cashOnCashReturn: -5.89,
          irr: 7.9,
          dscr: 0.72,
          operatingExpenseRatio: 35,
          totalInvestment: 147500,
        } as AnalysisPayload['metrics'],
        monthlyAnalysis: {
          cashFlow: -358,
          expenses: { debt: 1820 },
        },
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
      expect(card.keyMetrics).toBeDefined();
      expect(card.keyMetrics!.monthlyCashFlow).toBe(-358);
      expect(card.keyMetrics!.capRate).toBe(5.2);
      expect(card.keyMetrics!.irr).toBe(7.9);
      expect(card.keyMetrics!.dscr).toBe(0.72);
      expect(card.keyMetrics!.cashOnCashReturn).toBe(-5.89);
      expect(card.keyMetrics!.annualNOI).toBe(18500);
      expect(card.keyMetrics!.totalInvestment).toBe(147500);
      expect(card.keyMetrics!.monthlyDebtService).toBe(1820);
    });

    it('omits the keyMetrics key entirely when all fields are missing', () => {
      // Pre-Day-11d analyses lack metrics + monthlyAnalysis populated
      // through. The wire shape should NOT include an empty keyMetrics
      // object — emails treat the omission as "render the pre-Day-11d
      // shape, no Key Metrics section."
      const analysis = fakeAnalysis(fakeSFRData(), {
        metrics: {} as AnalysisPayload['metrics'],
        monthlyAnalysis: {},
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
      expect(card.keyMetrics).toBeUndefined();
    });

    it('includes partial keyMetrics when only some fields exist', () => {
      // An analysis that produced cap rate + cash flow but no IRR (e.g.,
      // a quick-pass analysis without long-term projection) should
      // still surface the two it has.
      const analysis = fakeAnalysis(fakeSFRData(), {
        metrics: { capRate: 5.5 } as AnalysisPayload['metrics'],
        monthlyAnalysis: { cashFlow: 200 },
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
      expect(card.keyMetrics).toBeDefined();
      expect(card.keyMetrics!.capRate).toBe(5.5);
      expect(card.keyMetrics!.monthlyCashFlow).toBe(200);
      expect(card.keyMetrics!.irr).toBeUndefined();
      expect(card.keyMetrics!.dscr).toBeUndefined();
    });

    it('filters NaN / non-finite values defensively', () => {
      // An engine bug or partial computation could leave NaN in some
      // fields. The projection MUST NOT propagate non-finite numbers
      // to the email (they'd render as "NaN%" which embarrasses).
      const analysis = fakeAnalysis(fakeSFRData(), {
        metrics: {
          capRate: NaN,
          irr: 7.9,
          dscr: Infinity,
        } as AnalysisPayload['metrics'],
      });
      const card = projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
      expect(card.keyMetrics!.capRate).toBeUndefined();
      expect(card.keyMetrics!.dscr).toBeUndefined();
      expect(card.keyMetrics!.irr).toBe(7.9);
    });
  });

  // ===== Day 11e — Layer-1 anonymous gating (Issue E1) =====
  //
  // gateCardForAnonymous strips the rich fields from a full card for
  // anonymous (ghost) users. The headline score stays; the breakdown,
  // walk-away, projection, keyMetrics, and assumptions get gated to
  // incentivize sign-up.

  describe('gateCardForAnonymous (Day 11e / Issue E1)', () => {
    function fullCard() {
      const analysis = fakeAnalysis(fakeSFRData(), {
        metrics: {
          capRate: 5.2,
          irr: 7.9,
          dscr: 1.25,
          cashOnCashReturn: 4.5,
          noi: 18500,
          totalInvestment: 147500,
          operatingExpenseRatio: 35,
        } as AnalysisPayload['metrics'],
        monthlyAnalysis: {
          cashFlow: 350,
          expenses: { debt: 1820 },
        },
        longTermAnalysis: {
          yearlyProjections: [
            { year: 1, cashFlow: 4200, propertyValue: 440000, equity: 110000 },
            { year: 3, cashFlow: 4800, propertyValue: 470000, equity: 145000 },
          ],
        } as AnalysisPayload['longTermAnalysis'],
      });
      return projectDealScoreCard(analysis, fakeDecision(), 'buy_hold');
    }

    it('keeps the headline fields the user must still see (score + address + strategy)', () => {
      const full = fullCard();
      const gated = gateCardForAnonymous(full);
      expect(gated.strategy).toBe(full.strategy);
      expect(gated.address).toEqual(full.address);
      expect(gated.dealQuality).toBe(full.dealQuality);
      expect(gated.purchasePrice).toBe(full.purchasePrice);
      expect(gated.nextStep).toBe(full.nextStep);
    });

    it('strips the engine breakdown (topFactors)', () => {
      const gated = gateCardForAnonymous(fullCard());
      expect(gated.topFactors).toEqual([]);
    });

    it('strips walk-away price (replaces with 0 so the frontend suppresses the row)', () => {
      const full = fullCard();
      expect(full.walkAwayPrice).toBeGreaterThan(0); // sanity — was populated
      const gated = gateCardForAnonymous(full);
      expect(gated.walkAwayPrice).toBe(0);
    });

    it('strips assumptions, projection, and keyMetrics (omits them entirely)', () => {
      const full = fullCard();
      // sanity — these were populated in the full card
      expect(full.projection).toBeDefined();
      expect(full.keyMetrics).toBeDefined();
      const gated = gateCardForAnonymous(full);
      expect(gated.assumptions).toEqual([]);
      expect(gated.projection).toBeUndefined();
      expect(gated.keyMetrics).toBeUndefined();
    });

    it('is idempotent — re-gating an already-gated card produces the same shape', () => {
      const once = gateCardForAnonymous(fullCard());
      const twice = gateCardForAnonymous(once);
      expect(twice).toEqual(once);
    });
  });
});
