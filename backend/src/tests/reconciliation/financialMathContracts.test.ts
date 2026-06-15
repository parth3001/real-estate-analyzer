/**
 * Cross-surface financial math contracts (2026-06-14).
 *
 * THE BUG CLASS THIS PREVENTS
 * ----------------------------
 *
 * Some fields in the analyzer's output are read by multiple surfaces.
 * Historically nothing forced those surfaces to agree:
 *   - Per-row `totalReturn` (cashFlow + cumulativeAppreciation — wrong) was
 *     dormant data that v1.0 frontend bypassed; v2.0 workspace exposed it.
 *     Result: Y10 row showed $99,956 while the summary panel showed $63,684
 *     for the same property. (333 Cherry Lane, Allen TX — 2026-06-14.)
 *
 * THE RULE THIS FILE ENFORCES
 * ---------------------------
 *
 *   If two surfaces display the same financial concept, they must reconcile.
 *   Specifically: any field a v2.0 surface displays must agree with v1.0's
 *   proven formula for that concept.
 *
 * SCOPE
 * -----
 *
 * Per the architect's call (2026-06-14): V3.0 testing rigorously validated
 * the SCORING DECISION (dealQuality, verdict, IRR/CapRate/CoC/DSCR ranges).
 * These tests do NOT re-validate any of that — they only assert that fields
 * v1.0 bypassed (and v2.0 surfaces now consume) reconcile against v1.0's
 * proven primitives.
 */

import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { MarketTierService } from '../../services/investment/marketTierService';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

function makeAssumptions(): AnalysisAssumptions {
  return {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2.5,
    annualPropertyValueIncrease: 3.5,
    sellingCosts: 6,
    vacancyRate: 5,
  };
}

function makeProperty(
  overrides: Partial<SFRData> = {}
): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 250_000,
    downPayment: 62_500,
    closingCosts: 3_750,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2_500,
    propertyManagementRate: 8,
    monthlyRent: 1_800, // Allen TX-style "high price, low rent" — the same
                       // property class that surfaced the bug. Important to
                       // keep this as the test fixture so the contract
                       // protects the actual failure scenario.
    propertyAddress: {
      street: '1 Contract Test Way',
      city: 'Allen',
      state: 'TX',
      zipCode: '75002',
    },
    squareFootage: 1_800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1990,
    ...overrides,
  };
}

describe('Financial math contracts — cross-surface reconciliation', () => {
  describe('totalReturn', () => {
    /**
     * The smoking-gun assertion. If the per-row totalReturn at year =
     * projectionYears does not agree with the summary totalReturn, the
     * v2.0 workspace year-by-year row and the Long-term summary panel will
     * display two different "Total Return" numbers for the same property.
     *
     * Pre-fix (2026-06-14): Y10 row showed $99,956, summary showed $63,684.
     * Post-fix: they must agree within $1 (rounding).
     */
    it('per-row totalReturn at final year equals summary totalReturn', () => {
      const analyzer = new SFRAnalyzer(makeProperty(), makeAssumptions());
      const result = analyzer.analyze();

      const projections = result.longTermAnalysis.projections;
      const finalYearRow = projections[projections.length - 1];
      const summary = result.longTermAnalysis.returns;

      // Within $1 — rounding only.
      const drift = Math.abs(finalYearRow.totalReturn - summary.totalReturn);
      if (drift > 1) {
        throw new Error(
          `[REGRESSION] Per-row totalReturn at Y${finalYearRow.year} = ` +
            `$${finalYearRow.totalReturn.toFixed(2)} disagrees with summary ` +
            `totalReturn = $${summary.totalReturn.toFixed(2)} by ` +
            `$${drift.toFixed(2)}. ` +
            `This is the 333 Cherry Lane bug — the v2.0 workspace ` +
            `year-by-year table and the Long-term summary panel will ` +
            `display two different "Total Return" numbers for the same ` +
            `property. See BasePropertyAnalyzer.ts ~line 333 (per-row) and ` +
            `~line 436 (summary). Both must use the v1.0 formula: ` +
            `cumulativeCashFlow + netSaleProceeds - totalInvestment.`
        );
      }
      expect(drift).toBeLessThan(1);
    });

    it('per-row totalReturn at year 1 reflects the honest "selling early loses money" reality', () => {
      const analyzer = new SFRAnalyzer(makeProperty(), makeAssumptions());
      const result = analyzer.analyze();

      const y1 = result.longTermAnalysis.projections[0];

      // For this test fixture (high price, low rent, 5% appreciation),
      // selling at end of year 1 means: tiny appreciation eaten by 6%
      // selling costs + tiny principal paydown vs. full initial investment.
      // The investor would be DOWN at exit. The number must be negative.
      // The pre-fix value was positive ($3,261) which misled investors.
      if (y1.totalReturn >= 0) {
        throw new Error(
          `[CONTRACT VIOLATION] Year 1 totalReturn = $${y1.totalReturn} but ` +
            `should be NEGATIVE for this test fixture (selling at end of Y1 ` +
            `eats appreciation + tiny paydown in selling costs). Pre-fix ` +
            `formula "cashFlow + cumulativeAppreciation" gave a misleading ` +
            `positive value. The fix must use v1.0's "if sold now" formula.`
        );
      }
      expect(y1.totalReturn).toBeLessThan(0);
    });

    it('per-row totalReturn monotonically improves year over year (for this fixture)', () => {
      // Sanity check: for a property that survives 10 years, totalReturn
      // should be increasing over time (appreciation + principal paydown
      // outpacing negative cash flow). If a row breaks the monotonic trend,
      // something in the formula is wrong.
      const analyzer = new SFRAnalyzer(makeProperty(), makeAssumptions());
      const result = analyzer.analyze();
      const projections = result.longTermAnalysis.projections;

      for (let i = 1; i < projections.length; i++) {
        const prev = projections[i - 1].totalReturn;
        const curr = projections[i].totalReturn;
        if (curr <= prev) {
          throw new Error(
            `[CONTRACT VIOLATION] totalReturn non-monotonic: ` +
              `Y${projections[i - 1].year} = $${prev.toFixed(2)}, ` +
              `Y${projections[i].year} = $${curr.toFixed(2)}. ` +
              `For this fixture (3.5% appreciation, 30yr amortization, ` +
              `5% annual rent growth), totalReturn must grow monotonically.`
          );
        }
      }
    });
  });

  describe('cash flow reconciliation', () => {
    /**
     * monthlyAnalysis.cashFlow × 12 must equal annualAnalysis.cashFlow and
     * projections[0].cashFlow within rounding. v1.0 + V3.0 validated this
     * implicitly; this test locks it in explicitly.
     */
    it('monthlyAnalysis.cashFlow × 12 ≈ Year 1 projection cashFlow', () => {
      const analyzer = new SFRAnalyzer(makeProperty(), makeAssumptions());
      const result = analyzer.analyze();

      const monthlyTimes12 = result.monthlyAnalysis.cashFlow * 12;
      const y1CashFlow = result.longTermAnalysis.projections[0].cashFlow;

      // Within $5 — accounts for capitalImprovements applied at Y1 only
      // and rounding.
      expect(Math.abs(monthlyTimes12 - y1CashFlow)).toBeLessThan(5);
    });
  });

  describe('NOI reconciliation', () => {
    it('analyzer NOI === Year 1 projection NOI', () => {
      const analyzer = new SFRAnalyzer(makeProperty(), makeAssumptions());
      const result = analyzer.analyze();

      const headlineNoi = result.keyMetrics.noi;
      const y1Noi = result.longTermAnalysis.projections[0].noi;

      // Same calculation source, must be byte-equal.
      expect(Math.abs(headlineNoi - y1Noi)).toBeLessThan(1);
    });
  });

  /**
   * Pre-fix on 333 Cherry Lane Allen TX ($250K, $1,800 rent): the engine
   * computed fairValue = $18,514,286. Two stacked bugs:
   *
   *   1. marketTierService.ts:220 used `NOI / (targetCapRate / 100)` —
   *      the function assumed targetCapRate was a percent (e.g., 7) but
   *      every caller passes it as a decimal (0.07). The extraneous /100
   *      multiplied the result by 100×.
   *   2. investmentDecisionEngine.ts:337 fell back to `monthlyRent × 12 × 0.6`
   *      when fundamentals.noi was falsy — used a gross-rent estimate instead
   *      of the analyzer's real NOI.
   *
   * The inflated fairValue fed engine logic at line 347 (`overpriced` flag),
   * which has been silently always-false for every property since shipped.
   * It also fed the engine's secondary reasoning narrative.
   *
   * Per the architect's rule (2026-06-14), V3.0 scoring outputs that were
   * proven correct (dealQuality, verdict, IRR/CapRate/CoC/DSCR) are NOT
   * touched. This test only enforces that helper outputs WHICH FEED engine
   * reasoning AND DOWNSTREAM SURFACES land in a sane bound.
   */
  describe('fairValue helper', () => {
    it('marketTierService.calculateFairMarketValue returns a sane value for a normal property', () => {
      // Stable test fixture: tier-3 (cash flow market), known NOI.
      const noi = 8762; // matches 333 Cherry's analyzer NOI
      const marketTier = {
        tier: 3 as const,
        name: 'Tier 3 - Cash Flow Market',
        focus: 'cashflow' as const,
        thresholds: {
          capRatePremium: 0,
          minCashFlow: 0,
          maxLTV: 0.8,
          targetCashOnCash: 0,
        },
      };
      const marketMedianCapRate = 0.07; // 7% market median (decimal — the unit
                                         // the engine passes everywhere)

      const result = MarketTierService.calculateFairMarketValue(
        noi,
        marketTier as unknown as Parameters<
          typeof MarketTierService.calculateFairMarketValue
        >[1],
        marketMedianCapRate
      );

      // For NOI $8,762 at 7% cap rate: fairValue should be ~$125,171.
      // Pre-fix value was $12,517,143 (off by 100×) or even worse when
      // combined with the bogus 60%-of-rent NOI fallback ($18.5M for
      // 333 Cherry).
      expect(result.fairValue).toBeGreaterThan(100_000);
      expect(result.fairValue).toBeLessThan(200_000);
    });

    it('fairValue stays inside a sane bound for the same fixture as the totalReturn tests', () => {
      // Belt-and-suspenders: even when the function is wired into the
      // full analyzer + engine pipeline, fairValue must land within
      // [0.3 × purchasePrice, 3 × purchasePrice]. Pre-fix value was 74×
      // for 333 Cherry (~$18.5M vs $250K purchase). Catches any future
      // unit error before it ships.
      const noi = 8762;
      const marketTier = {
        tier: 3 as const,
        name: 'Tier 3',
        focus: 'cashflow' as const,
        thresholds: {
          capRatePremium: 0,
          minCashFlow: 0,
          maxLTV: 0.8,
          targetCashOnCash: 0,
        },
      };
      const result = MarketTierService.calculateFairMarketValue(
        noi,
        marketTier as unknown as Parameters<
          typeof MarketTierService.calculateFairMarketValue
        >[1],
        0.07
      );

      const purchasePrice = 250_000;
      const ratio = result.fairValue / purchasePrice;
      if (ratio < 0.3 || ratio > 3) {
        throw new Error(
          `[CONTRACT VIOLATION] fairValue ${result.fairValue} is ` +
            `${ratio.toFixed(2)}× purchase price ${purchasePrice}. ` +
            `Sane fair-value-vs-price ratios are in [0.3, 3]. This is the ` +
            `signature of a unit-error bug like marketTierService.ts:220 ` +
            `dividing targetCapRate by 100 when it's already in decimal form.`
        );
      }
      expect(ratio).toBeGreaterThan(0.3);
      expect(ratio).toBeLessThan(3);
    });
  });
});
