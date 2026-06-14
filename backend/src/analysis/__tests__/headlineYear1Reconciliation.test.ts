/**
 * Task #43 / #44 reconciliation test — the 200% accuracy contract.
 *
 * Asserts that the analyzer's HEADLINE values (which feed the
 * Financials view of a saved deal) reconcile exactly with the
 * analyzer's PROJECTION Year 1 values (which feed the Year-by-year
 * view of the same saved deal).
 *
 * THE BUG THIS PREVENTS (the original Task #43)
 * ──────────────────────────────────────────────
 *
 * Pre-Task-#43: SFRCalculationEngine.calculateOperatingExpenses() used
 * "5% of rent" as the CapEx default for SFR properties that didn't
 * explicitly set monthlyCapEx. BasePropertyAnalyzer.calculateProjections
 * used 0 as the CapEx default in its inline OpEx computation. Two
 * different defaults → two different OpEx → two different NOI → two
 * different cash flow values for the SAME property, SAME year.
 *
 * The user-visible symptom: saved-deal Financials card showed monthly
 * cash flow that, multiplied by 12, did NOT equal the Year 1 cash flow
 * in the Year-by-year projection table. Trust-killer for a financial
 * analysis product.
 *
 * THE CONTRACT THIS TEST LOCKS
 * ────────────────────────────
 *
 * For any SFR analysis where year-1 inputs and headline inputs are
 * the same:
 *   headline.NOI      ≈ projection.year1.NOI       (±$1 rounding)
 *   headline.cashFlow ≈ projection.year1.cashFlow  (±$1 rounding)
 *   headline.opEx     ≈ projection.year1.opEx      (±$1 rounding)
 *
 * If these fail, the analyzer has drifted to two definitions of NOI
 * again and a saved deal's two views will show different numbers.
 *
 * Additional test: a property that EXPLICITLY sets monthlyCapEx must
 * still reconcile (catches the bug class where the explicit value
 * isn't honored consistently across the two code paths).
 */

import { SFRAnalyzer } from '../SFRAnalyzer';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../BasePropertyAnalyzer';

function makeStandardAssumptions(): AnalysisAssumptions {
  return {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2.5,
    annualPropertyValueIncrease: 3.5,
    sellingCosts: 6,
    vacancyRate: 5,
  };
}

function makeStandardSFR(overrides: Partial<SFRData> = {}): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 210_000,
    downPayment: 52_500,
    interestRate: 6.48,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2_100,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '1841 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409',
    },
    monthlyRent: 1_850,
    squareFootage: 1_268,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2007,
    ...overrides,
  };
}

describe('Task #43 — headline NOI = projection Year 1 NOI (reconciliation contract)', () => {
  describe('SFR with NO explicit monthlyCapEx (default-CapEx path)', () => {
    it('headline NOI equals projection Year 1 NOI (±$1)', () => {
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();

      const headlineNOI = result.annualAnalysis.noi;
      const year1NOI = result.longTermAnalysis.projections[0].noi;

      expect(Math.abs(headlineNOI - year1NOI)).toBeLessThan(1);
    });

    it('headline operating expenses equals projection Year 1 operating expenses (±$1)', () => {
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();

      const headlineOpEx = result.annualAnalysis.expenses;
      const year1OpEx = result.longTermAnalysis.projections[0].operatingExpenses;

      expect(Math.abs(headlineOpEx - year1OpEx)).toBeLessThan(1);
    });

    it('headline annual cash flow equals projection Year 1 cash flow (±$1)', () => {
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();

      const headlineCashFlow = result.annualAnalysis.cashFlow;
      const year1CashFlow = result.longTermAnalysis.projections[0].cashFlow;

      expect(Math.abs(headlineCashFlow - year1CashFlow)).toBeLessThan(1);
    });

    it('headline monthly cash flow × 12 equals projection Year 1 cash flow (±$5)', () => {
      // The exact cross-view consistency check that motivated Task #43:
      // user said "Financials shows -$117/mo, Year 1 shows -$299/yr; these
      // should reconcile." With this test passing, they reconcile.
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();

      const monthlyCashFlow = result.monthlyAnalysis.cashFlow;
      const year1AnnualCashFlow = result.longTermAnalysis.projections[0].cashFlow;

      expect(Math.abs(monthlyCashFlow * 12 - year1AnnualCashFlow)).toBeLessThan(5);
    });
  });

  describe('SFR with EXPLICIT monthlyCapEx (explicit-CapEx path)', () => {
    it('headline NOI equals projection Year 1 NOI when monthlyCapEx is set (±$1)', () => {
      const data = makeStandardSFR({ monthlyCapEx: 150 } as unknown as Partial<SFRData>);
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();

      const headlineNOI = result.annualAnalysis.noi;
      const year1NOI = result.longTermAnalysis.projections[0].noi;

      expect(Math.abs(headlineNOI - year1NOI)).toBeLessThan(1);
    });

    it('explicit CapEx is reflected on both paths (sanity)', () => {
      // Same property with explicit CapEx should produce LOWER NOI than
      // the default-CapEx path — confirming the field is honored
      // (regression guard against either path ignoring monthlyCapEx).
      const withExplicit = new SFRAnalyzer(
        makeStandardSFR({ monthlyCapEx: 300 } as unknown as Partial<SFRData>),
        makeStandardAssumptions()
      ).analyze();
      const withDefault = new SFRAnalyzer(
        makeStandardSFR(),
        makeStandardAssumptions()
      ).analyze();

      // Higher explicit CapEx than the 5%-of-rent default (~$92.50/mo)
      // should produce lower NOI on both surfaces.
      expect(withExplicit.annualAnalysis.noi).toBeLessThan(withDefault.annualAnalysis.noi);
      expect(
        withExplicit.longTermAnalysis.projections[0].noi
      ).toBeLessThan(withDefault.longTermAnalysis.projections[0].noi);
    });
  });

  describe('Mathematical identities on each surface', () => {
    it('headline: effectiveIncome - operatingExpenses - debtService === cashFlow (±$1)', () => {
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();
      const a = result.annualAnalysis;

      // The substrate annualAnalysis stores `income` as GROSS (not effective).
      // Effective is monthly.income.effective × 12.
      const annualEffective = result.monthlyAnalysis.income.effective * 12;
      const derived = annualEffective - a.expenses - a.debtService;

      expect(Math.abs(derived - a.cashFlow)).toBeLessThan(1);
    });

    it('headline: NOI - debtService === cashFlow (±$1)', () => {
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();
      const a = result.annualAnalysis;

      expect(Math.abs(a.noi - a.debtService - a.cashFlow)).toBeLessThan(1);
    });

    it('projection Year 1: NOI - debtService === cashFlow (±$1, allowing for capitalImprovements adjustment)', () => {
      const data = makeStandardSFR();
      const result = new SFRAnalyzer(data, makeStandardAssumptions()).analyze();
      const p = result.longTermAnalysis.projections[0];

      // Year 1 may include capitalImprovements as a one-time subtraction.
      const capImp =
        (p as { capitalImprovements?: number }).capitalImprovements ?? 0;
      const derived = p.noi - p.debtService - capImp;

      expect(Math.abs(derived - p.cashFlow)).toBeLessThan(1);
    });
  });
});
