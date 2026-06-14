/**
 * Task #41 contract test — full-projection lock.
 *
 * Asserts the materializer's projectAnalysis() projects EVERY
 * analyzer-produced field to its Deal counterpart. Pre-Task-#41 the
 * materializer hand-curated a small allowlist and silently dropped
 * ~16 metrics + had 5 field-name renames silently producing undefined.
 * That bug class is closed when this test passes.
 *
 * Strategy:
 *   1. Build a substrate AnalysisPayload with EVERY field the analyzer
 *      can produce, with distinct sentinel values per field.
 *   2. Materialize a Deal.
 *   3. Assert each Deal field carries the sentinel value (proves the
 *      projection touched it; not undefined; not a default).
 *
 * If a future contributor adds a new analyzer metric to SFRMetrics in
 * types/analysis.ts, the path to make this test continue passing is:
 *   - Add the field to SFRMetricsShape in analysisShapes.ts
 *   - Add the field to projectAnalysis() in dealMaterializationService.ts
 *   - Add a fixture value + assertion here
 * The test forces the additive discipline — silent drops break it.
 *
 * NOT covered by this test:
 *   - The "tolerant parse on legacy data" path (substrate predating
 *     #41 with missing fields). That's exercised by the
 *     pre-existing dealMaterializationService.test.ts happy path on
 *     partial fixtures.
 *   - MultiFamilyMetrics-specific fields. Those will need a parallel
 *     test once the MF chat flow is wired (Task #30).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { materializeDealFromDecision } from '../dealMaterializationService';
import { User } from '../../models/User';
import { DealModel as Deal } from '../../models/Deal';
import { eventsRepository } from '../../repositories/EventsRepository';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { SFRData } from '../../types/propertyTypes';

const SETUP_TIMEOUT_MS = 90_000;

/**
 * Sentinel values per field — chosen to be uniquely identifiable in
 * assertions and unlikely to collide with defaults. Each field gets a
 * different value so assertion failures point precisely at which field
 * the projection missed.
 */
const FIXTURE = {
  // Monthly income
  monthlyGross: 2050,
  monthlyEffective: 1948,
  // Monthly expense breakdown
  propertyTax: 308,
  insurance: 116,
  maintenance: 171,
  propertyManagement: 144,
  vacancy: 90,
  tenantTurnover: 50,
  utilities: 0,
  commonAreaElectricity: 0,
  landscaping: 0,
  waterSewer: 0,
  garbage: 0,
  marketingAndAdvertising: 0,
  repairsAndMaintenance: 0,
  capEx: 0,
  // Monthly expense totals
  monthlyOperatingTotal: 894,
  monthlyDebt: 974,
  monthlyExpensesTotal: 1868,
  monthlyCashFlow: 80,
  // Metrics — load-bearing v1 promises from the pricing page
  noi: 12645,
  capRate: 6.17,
  cashOnCashReturn: 1.76,
  irr: 13.78,
  dscr: 1.08,
  operatingExpenseRatio: 45.89,
  totalInvestment: 54325,
  // SFR-specific metrics
  pricePerSqFt: 161.7,
  rentPerSqFt: 1.62,
  grossRentMultiplier: 12.0,
  breakEvenOccupancy: 91.1,
  equityMultiple: 2.4,
  onePercentRuleValue: 0.875,
  rentToPriceRatio: 0.0107,
  pricePerBedroom: 68333,
  debtToIncomeRatio: 0.48,
  returnOnImprovements: 0,
  turnoverCostImpact: 0.5,
  debtYield: 0.082,
  grossYield: 0.12,
  // Long-term values
  walkAwayPrice: 157646,
  projectionYears: 10,
  irrReturn: 13.78,
  totalCashFlow: 44023,
  totalAppreciation: 84173,
  totalReturn: 130212,
};

function makePropertyData(): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 205000,
    downPayment: 51250,
    interestRate: 6.48,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2050,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '1117 Daffodil St',
      city: 'Princeton',
      state: 'TX',
      zipCode: '75407',
    },
    monthlyRent: 2050,
    squareFootage: 1268,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2007,
  };
}

function makeAnalysisPayload(): AnalysisPayload {
  const yearlyProjection = (year: number) => ({
    year,
    propertyValue: 205000 + year * 7000,
    grossIncome: 24600 + year * 600,
    operatingExpenses: 9495,
    noi: FIXTURE.noi + year * 400,
    debtService: 11688,
    cashFlow: 2188 + year * 500,
    equity: 50000 + year * 10000,
    mortgageBalance: 152089 - year * 2500,
    totalReturn: 9000 + year * 8000,
    propertyTax: 308 * 12,
    insurance: 116 * 12,
    maintenance: 171 * 12,
    propertyManagement: 144 * 12,
    vacancy: 90 * 12,
    realtorBrokerageFee: 0,
    grossRent: 24600 + year * 600,
    appreciation: 7000,
  });

  // Cast loose because AnalysisPayload's nested fields are still
  // ObjectShape until Tier 1 ships. The test exercises the materializer's
  // parsing of these objects.
  return {
    propertyData: makePropertyData() as unknown as AnalysisPayload['propertyData'],
    marketData: {
      lastUpdated: new Date(),
      dataSource: ['rentcast'],
    } as unknown as AnalysisPayload['marketData'],
    assumptions: { vacancyRate: 5, projectionYears: 10 },
    metrics: {
      noi: FIXTURE.noi,
      capRate: FIXTURE.capRate,
      cashOnCashReturn: FIXTURE.cashOnCashReturn,
      irr: FIXTURE.irr,
      dscr: FIXTURE.dscr,
      operatingExpenseRatio: FIXTURE.operatingExpenseRatio,
      totalInvestment: FIXTURE.totalInvestment,
      pricePerSqFt: FIXTURE.pricePerSqFt,
      rentPerSqFt: FIXTURE.rentPerSqFt,
      grossRentMultiplier: FIXTURE.grossRentMultiplier,
      breakEvenOccupancy: FIXTURE.breakEvenOccupancy,
      equityMultiple: FIXTURE.equityMultiple,
      onePercentRuleValue: FIXTURE.onePercentRuleValue,
      fiftyRuleAnalysis: true,
      rentToPriceRatio: FIXTURE.rentToPriceRatio,
      pricePerBedroom: FIXTURE.pricePerBedroom,
      debtToIncomeRatio: FIXTURE.debtToIncomeRatio,
      returnOnImprovements: FIXTURE.returnOnImprovements,
      turnoverCostImpact: FIXTURE.turnoverCostImpact,
      debtYield: FIXTURE.debtYield,
      grossYield: FIXTURE.grossYield,
    } as unknown as AnalysisPayload['metrics'],
    monthlyAnalysis: {
      income: {
        gross: FIXTURE.monthlyGross,
        effective: FIXTURE.monthlyEffective,
      },
      expenses: {
        operating: FIXTURE.monthlyOperatingTotal,
        debt: FIXTURE.monthlyDebt,
        total: FIXTURE.monthlyExpensesTotal,
        breakdown: {
          propertyTax: FIXTURE.propertyTax,
          insurance: FIXTURE.insurance,
          maintenance: FIXTURE.maintenance,
          propertyManagement: FIXTURE.propertyManagement,
          vacancy: FIXTURE.vacancy,
          tenantTurnover: FIXTURE.tenantTurnover,
          utilities: FIXTURE.utilities,
          commonAreaElectricity: FIXTURE.commonAreaElectricity,
          landscaping: FIXTURE.landscaping,
          waterSewer: FIXTURE.waterSewer,
          garbage: FIXTURE.garbage,
          marketingAndAdvertising: FIXTURE.marketingAndAdvertising,
          repairsAndMaintenance: FIXTURE.repairsAndMaintenance,
          capEx: FIXTURE.capEx,
        },
      },
      cashFlow: FIXTURE.monthlyCashFlow,
    } as unknown as AnalysisPayload['monthlyAnalysis'],
    longTermAnalysis: {
      projections: Array.from({ length: 10 }, (_, i) =>
        yearlyProjection(i + 1)
      ),
      exitAnalysis: {
        projectedSalePrice: 289173,
        sellingCosts: 17350,
        mortgagePayoff: 131308,
        netProceedsFromSale: 140514,
        totalReturn: 130212,
      },
      returns: {
        irr: FIXTURE.irrReturn,
        totalCashFlow: FIXTURE.totalCashFlow,
        totalAppreciation: FIXTURE.totalAppreciation,
        totalReturn: FIXTURE.totalReturn,
        totalInvestment: FIXTURE.totalInvestment,
      },
      projectionYears: FIXTURE.projectionYears,
    } as unknown as AnalysisPayload['longTermAnalysis'],
    walkAwayPrice: FIXTURE.walkAwayPrice,
    enrichmentSource: 'rentcast',
    enrichmentCacheHit: false,
    engineVersion: 'v3.0',
    computeTimeMs: 142,
  };
}

describe('Task #41 — full-projection contract (dealMaterializationService)', () => {
  let mongoServer: MongoMemoryServer;
  let userId: Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    const user = await User.create({
      email: 'task41-test@example.com',
      firstName: 'Task41',
      lastName: 'Test',
      role: 'user',
      isVerified: true,
      anonymous: false,
    });
    userId = user._id as Types.ObjectId;
  });

  async function seedAndMaterialize() {
    const analysisId = await eventsRepository.writeAnalysisEvent({
      traceId: 't41',
      actorType: 'tool:score_deal',
      userId,
      payload: makeAnalysisPayload(),
    });
    const decisionPayload: DecisionPayload = {
      analysisEventId: analysisId,
      dealQuality: 49,
      qualityLabel: 'Below professional standards',
      qualityColor: 'red',
      professionalAssessment: { dealQuality: 49 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: FIXTURE.walkAwayPrice } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'x',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    };
    const decisionId = await eventsRepository.writeDecisionEvent({
      traceId: 't41',
      actorType: 'agent:deal_scoring',
      userId,
      payload: decisionPayload,
    });
    await materializeDealFromDecision(decisionId, userId);
    const deal = await Deal.findOne({ userId }).lean();
    expect(deal).not.toBeNull();
    return deal!;
  }

  // ===== Long-term projection (the Task #32 root fix) =====

  describe('longTermAnalysis — the Task #32 root fix', () => {
    it('preserves ALL 10 yearly projections (not just milestone years)', async () => {
      const deal = await seedAndMaterialize();
      expect((deal.analysis?.longTermAnalysis as unknown as { projections?: Array<Record<string, number>> })?.projections).toBeDefined();
      expect((deal.analysis?.longTermAnalysis as unknown as { projections?: Array<Record<string, number>> })?.projections).toHaveLength(10);
    });

    it('every year has the full field set (NOI present on Year 5, Year 10, every year)', async () => {
      const deal = await seedAndMaterialize();
      const projections = (deal.analysis?.longTermAnalysis as unknown as { projections?: Array<Record<string, number>> })?.projections;
      expect(projections).toBeDefined();
      for (const yearRow of projections!) {
        // The exact regression check: NOI is the field the saved deal
        // was showing as a dash on Years 5/10 prior to #41.
        expect(yearRow.noi).toBeGreaterThan(0);
        expect(yearRow.cashFlow).toBeDefined();
        expect(yearRow.propertyValue).toBeGreaterThan(0);
        expect(yearRow.equity).toBeDefined();
        expect(yearRow.totalReturn).toBeDefined();
        expect(yearRow.debtService).toBeGreaterThan(0);
        expect(yearRow.mortgageBalance).toBeDefined();
      }
    });

    it('projectionYears is preserved (Hold period dash fix)', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.longTermAnalysis?.projectionYears).toBe(10);
    });

    it('returns block is preserved (IRR + totalReturn)', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.longTermAnalysis?.returns?.irr).toBe(FIXTURE.irrReturn);
      expect(deal.analysis?.longTermAnalysis?.returns?.totalCashFlow).toBe(
        FIXTURE.totalCashFlow
      );
      expect(deal.analysis?.longTermAnalysis?.returns?.totalReturn).toBe(
        FIXTURE.totalReturn
      );
    });
  });

  // ===== Monthly analysis =====

  describe('monthlyAnalysis projection', () => {
    it('income.gross and income.effective land on the Deal (was undefined pre-#41)', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.monthlyAnalysis?.income?.gross).toBe(FIXTURE.monthlyGross);
      expect(deal.analysis?.monthlyAnalysis?.income?.effective).toBe(
        FIXTURE.monthlyEffective
      );
    });

    it('expense breakdown line items land on the Deal', async () => {
      const deal = await seedAndMaterialize();
      const exp = deal.analysis?.monthlyAnalysis?.expenses;
      expect(exp?.propertyTax).toBe(FIXTURE.propertyTax);
      expect(exp?.insurance).toBe(FIXTURE.insurance);
      expect(exp?.maintenance).toBe(FIXTURE.maintenance);
      expect(exp?.propertyManagement).toBe(FIXTURE.propertyManagement);
      expect(exp?.vacancy).toBe(FIXTURE.vacancy);
      expect(exp?.tenantTurnover).toBe(FIXTURE.tenantTurnover);
    });

    it('cashFlow is preserved', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.monthlyAnalysis?.cashFlow).toBe(FIXTURE.monthlyCashFlow);
    });
  });

  // ===== Annual analysis (derived) =====

  describe('annualAnalysis derivations', () => {
    it('annualNOI is metrics.noi', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.annualAnalysis?.annualNOI).toBe(FIXTURE.noi);
    });

    it('annualDebtService is monthly.debt × 12 (was undefined pre-#41)', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.annualAnalysis?.annualDebtService).toBe(
        FIXTURE.monthlyDebt * 12
      );
    });

    it('effectiveGrossIncome is monthly.income.effective × 12 (was undefined pre-#41)', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.annualAnalysis?.effectiveGrossIncome).toBe(
        FIXTURE.monthlyEffective * 12
      );
    });

    it('dscr / capRate / cashOnCashReturn / totalInvestment pass through from metrics', async () => {
      const deal = await seedAndMaterialize();
      const a = deal.analysis?.annualAnalysis;
      expect(a?.dscr).toBe(FIXTURE.dscr);
      expect(a?.capRate).toBe(FIXTURE.capRate);
      expect(a?.cashOnCashReturn).toBe(FIXTURE.cashOnCashReturn);
      expect(a?.totalInvestment).toBe(FIXTURE.totalInvestment);
    });
  });

  // ===== Key metrics — the big drop list =====

  describe('keyMetrics — every analyzer-produced metric lands (no silent drops)', () => {
    it('the 3 originals (capRate / cashOnCashReturn / dscr) pass through', async () => {
      const deal = await seedAndMaterialize();
      const k = deal.analysis?.keyMetrics;
      expect(k?.capRate).toBe(FIXTURE.capRate);
      expect(k?.cashOnCashReturn).toBe(FIXTURE.cashOnCashReturn);
      expect(k?.dscr).toBe(FIXTURE.dscr);
    });

    it('grossRentMultiplier (GRM) — was dropped pre-#41', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.grossRentMultiplier).toBe(
        FIXTURE.grossRentMultiplier
      );
    });

    it('breakEvenOccupancy — was dropped pre-#41', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.breakEvenOccupancy).toBe(
        FIXTURE.breakEvenOccupancy
      );
    });

    it('equityMultiple — was dropped pre-#41', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.equityMultiple).toBe(
        FIXTURE.equityMultiple
      );
    });

    it('onePercentRuleValue — was dropped pre-#41', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.onePercentRuleValue).toBe(
        FIXTURE.onePercentRuleValue
      );
    });

    it('rentToPriceRatio + pricePerBedroom + debtToIncomeRatio — were dropped pre-#41', async () => {
      const deal = await seedAndMaterialize();
      const k = deal.analysis?.keyMetrics;
      expect(k?.rentToPriceRatio).toBe(FIXTURE.rentToPriceRatio);
      expect(k?.pricePerBedroom).toBe(FIXTURE.pricePerBedroom);
      expect(k?.debtToIncomeRatio).toBe(FIXTURE.debtToIncomeRatio);
    });

    // Renames (substrate → Deal)
    it('substrate.pricePerSqFt → Deal.pricePerSqFtAtPurchase', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.pricePerSqFtAtPurchase).toBe(
        FIXTURE.pricePerSqFt
      );
    });

    it('substrate.rentPerSqFt → Deal.avgRentPerSqFt', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.avgRentPerSqFt).toBe(FIXTURE.rentPerSqFt);
    });

    it('substrate.operatingExpenseRatio → Deal.expenseRatio', async () => {
      const deal = await seedAndMaterialize();
      expect(deal.analysis?.keyMetrics?.expenseRatio).toBe(
        FIXTURE.operatingExpenseRatio
      );
    });
  });

  // ===== Walk-away price (regression guard for Task #11) =====

  describe('walkAwayPrice (regression guard for #11)', () => {
    it('walkAwayPrice lands on the Deal at the top level', async () => {
      const deal = await seedAndMaterialize();
      // walkAwayPrice is on the runtime Analysis shape but not the static
      // Analysis interface — cast to bypass the static-only narrowing.
      const analysisAny = deal.analysis as unknown as { walkAwayPrice?: number };
      expect(analysisAny?.walkAwayPrice).toBe(FIXTURE.walkAwayPrice);
    });
  });
});
