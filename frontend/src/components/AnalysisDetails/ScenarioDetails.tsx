/**
 * ScenarioDetails — per-scenario depth for the workspace (Task #8).
 *
 * Renders the SELECTED scenario's financials + long-term analysis from the
 * scenario-detail endpoint (AnalysisEvent payload). This is the depth that
 * replaces the legacy 11-tab "Deep Dive" — scoped to the selected scenario,
 * so switching scenarios re-points these numbers too (the whole point of
 * the scenario-scoped page).
 *
 * Migration (Task #19, 2026-05-21): this now carries the FULL substrate-backed
 * depth that the legacy AnalysisResults tabs used to show — including the
 * monthly income/expense breakdown (Financial Details tab) and the
 * year-by-year projection table (Long-term Analysis tab, the section that
 * rendered "No Projection Data Available" in legacy). All fields read the
 * REAL analyzer shape verified against BasePropertyAnalyzer.analyze():
 *   monthlyAnalysis  = { income:{gross,effective}, expenses:{operating,debt,total}, cashFlow }
 *   longTermAnalysis = { projections: YearlyProjection[], exitAnalysis, returns, projectionYears }
 *   returns          = { irr (decimal), totalCashFlow, totalAppreciation, totalReturn }
 *
 * Collapsible sections (Apple progressive disclosure). Defensive field
 * access — substrate analysis payloads are loose Record shapes; missing
 * values render "–" rather than crashing. Negative cash flow renders in the
 * danger color so a money-bleeding deal reads honestly (trust > optics).
 */

import { useState } from 'react';
import { Box, Typography, Collapse, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ScenarioDetailWire, ScenarioComparableWire } from '../../services/api';
import { WorkspaceSection } from './WorkspaceSection';

export interface ScenarioDetailsProps {
  detail: ScenarioDetailWire | null;
  /**
   * Human-readable name of the currently-selected scenario, e.g.
   * "Baseline" or "Monthly rent ↑". Rendered in the Details section
   * header so the user can always see WHICH scenario the numbers
   * below belong to. Optional for backward compat — falls back to
   * generic "selected scenario" phrasing when omitted.
   * (Issue #95 / #225 follow-up, 2026-07-07)
   */
  scenarioName?: string;
}

const fmtCurrency = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v)
    : '–';

const fmtPct = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v) ? `${parseFloat(v.toFixed(2))}%` : '–';

const fmtRatio = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(2) : '–';

const fmtNum = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v) ? Math.round(v).toLocaleString('en-US') : '–';

const fmtMiles = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v) ? `${v.toFixed(1)} mi` : '–';

const fmtText = (v: unknown): string =>
  typeof v === 'string' && v.trim().length > 0 ? v : '–';

// IRR is stored as a decimal (e.g. 0.0608) — display as a percent.
const fmtIrr = (v: unknown): string =>
  typeof v === 'number' && !Number.isNaN(v)
    ? `${parseFloat((v * 100).toFixed(2))}%`
    : '–';

function num(o: Record<string, unknown> | undefined, k: string): unknown {
  return o ? o[k] : undefined;
}

/** Loose nested access for the income/expenses sub-objects. */
function nestedNum(
  o: Record<string, unknown> | undefined,
  k1: string,
  k2: string
): unknown {
  const inner = o ? (o[k1] as Record<string, unknown> | undefined) : undefined;
  return inner ? inner[k2] : undefined;
}

/** A label/value row; `negative` paints the value in the danger color. */
interface Row {
  label: string;
  value: string;
  negative?: boolean;
  /**
   * Optional explanatory hint — renders an info icon next to the label
   * that surfaces this text on hover. Used (#72) to disclose
   * methodology choices that aren't universally followed (e.g., the
   * engine includes CapEx reserves in OPEX, which compresses NOI vs
   * Wall Street SFR convention).
   */
  hint?: string;
}

/** True when a numeric value is a real (non-NaN) negative number. */
const isNeg = (v: unknown): boolean =>
  typeof v === 'number' && !Number.isNaN(v) && v < 0;

export function ScenarioDetails({ detail, scenarioName }: ScenarioDetailsProps): React.JSX.Element | null {
  const [openSection, setOpenSection] = useState<string | null>('financials');

  if (!detail) return null;

  const m = (detail.metrics ?? {}) as Record<string, unknown>;
  const ma = (detail.monthlyAnalysis ?? {}) as Record<string, unknown>;
  const lt = (detail.longTermAnalysis ?? {}) as Record<string, unknown>;
  const returns = (lt.returns ?? {}) as Record<string, unknown>;
  const exit = (lt.exitAnalysis ?? {}) as Record<string, unknown>;
  const projections = Array.isArray(lt.projections)
    ? (lt.projections as Array<Record<string, unknown>>)
    : [];

  // Market snapshot frozen at analysis time (Task #19) — powers Market +
  // Comparables sections that replace the legacy Market/Comparables tabs.
  const md = detail.marketData ?? {};
  const trends = md.marketTrends ?? {};
  const econ = md.economicIndicators ?? {};
  const comps = Array.isArray(md.comparables) ? md.comparables : [];

  const market: Row[] = [
    { label: 'Median rent', value: fmtCurrency(trends.medianRent) },
    { label: 'Rent growth (12mo)', value: fmtPct(trends.rentGrowthRate) },
    { label: 'Median sale price', value: fmtCurrency(trends.medianSalePrice) },
    { label: 'Price growth (12mo)', value: fmtPct(trends.priceGrowthRate) },
    { label: 'Days on market', value: fmtNum(trends.daysOnMarket) },
    { label: 'Inventory level', value: fmtText(trends.inventoryLevel) },
    { label: 'Price-to-rent ratio', value: fmtRatio(trends.priceToRentRatio) },
    { label: 'Current mortgage rate', value: fmtPct(econ.currentMortgageRate) },
    { label: 'Rate trend', value: fmtText(econ.mortgageRateTrend) },
  ];
  // Render Market only if the snapshot actually carries trend/economic data
  // (a fallback-enriched analysis may have none — don't show a wall of "–").
  const hasMarket = [
    trends.medianRent,
    trends.medianSalePrice,
    trends.rentGrowthRate,
    econ.currentMortgageRate,
  ].some((v) => typeof v === 'number' && !Number.isNaN(v));

  const monthlyCashFlow = num(ma, 'cashFlow');

  // Task #58 (2026-06-16): break out vacancy as its own line in the
  // monthly cash-flow display. The adversarial critic flagged "vacancy
  // ignored" because the previous design folded it into the gross→
  // effective drop without a dedicated row — a CPA scanning a column of
  // expense line items reasonably reads "no vacancy line = $0 vacancy."
  // Math is unchanged; this is purely a transparency presentation fix.
  const grossMonthly = nestedNum(ma, 'income', 'gross');
  const effectiveMonthly = nestedNum(ma, 'income', 'effective');
  const vacancyMonthly =
    typeof grossMonthly === 'number' && typeof effectiveMonthly === 'number'
      ? grossMonthly - effectiveMonthly
      : undefined;
  const vacancyRate =
    typeof vacancyMonthly === 'number' &&
    typeof grossMonthly === 'number' &&
    grossMonthly > 0
      ? (vacancyMonthly / grossMonthly) * 100
      : undefined;

  // Phase 2.5 BRRRR (Issue #205 — 2026-06-25): prefer engine-computed
  // BRRRR metrics from substrate (detail.strategySpecific) when present;
  // fall back to inline derivation (Phase 2, #201) for deals saved
  // before #205 added strategySpecific projection. Both paths produce
  // the same numbers within rounding, but the engine path also exposes
  // post-refinance DSCR, exit scenarios, and other deeper fields the
  // BRRRRAnalyzer computes that we can't derive inline.
  const pd = (detail.propertyData ?? {}) as Record<string, unknown>;
  const isBrrrr =
    (pd.investmentStrategy as string | undefined) === 'brrrr' &&
    typeof pd.brrrr === 'object' &&
    pd.brrrr !== null;
  const brrrrBlock = isBrrrr ? (pd.brrrr as Record<string, unknown>) : null;
  const strategySpecific = (detail as { strategySpecific?: Record<string, unknown> })
    .strategySpecific;
  const engineCapitalRecovery =
    strategySpecific && typeof strategySpecific.capitalRecovery === 'object'
      ? (strategySpecific.capitalRecovery as Record<string, unknown>)
      : null;
  const enginePostRefi =
    strategySpecific && typeof strategySpecific.postRefinanceMetrics === 'object'
      ? (strategySpecific.postRefinanceMetrics as Record<string, unknown>)
      : null;
  const engineRule70 =
    strategySpecific && typeof strategySpecific.rule70Check === 'object'
      ? (strategySpecific.rule70Check as Record<string, unknown>)
      : null;
  // Issue #212 (2026-06-30) — refi loan lives on refinanceResults, not
  // postRefinanceMetrics. Prior reader looked for
  // enginePostRefi.refinanceLoanAmount which was always undefined,
  // silently falling back to inline math (ARV × LTV). That was one of
  // the sources of the chat-vs-workspace 93% vs 83.8% discrepancy.
  const engineRefinance =
    strategySpecific && typeof strategySpecific.refinanceResults === 'object'
      ? (strategySpecific.refinanceResults as Record<string, unknown>)
      : null;
  let brrrrRows: Row[] = [];
  if (brrrrBlock) {
    const rehabBudget = Number(brrrrBlock.rehabBudget) || 0;
    const arv = Number(brrrrBlock.afterRepairValue) || 0;
    const refiLTV = Number(brrrrBlock.refinanceLTV) || 75;
    const refiRate = Number(brrrrBlock.refinanceInterestRate) || 0;
    const seasoning = Number(brrrrBlock.seasoningPeriod) || 12;
    const purchasePrice = Number(pd.purchasePrice) || 0;
    const downPayment = Number(pd.downPayment) || 0;
    const closingCosts = Number(pd.closingCosts) || 0;
    // All-in for the 70% rule is purchase + rehab (per the rule's
    // canonical form). Including closing in "all-in cash" elsewhere
    // is fine but the rule itself excludes closing.
    const allInRule70 = purchasePrice + rehabBudget;
    const allInTotalCash = downPayment + rehabBudget + closingCosts;
    // Issue #212 (2026-06-30) — engine field-name mapping (was wrong in #205
    // Phase 2.5 which introduced the substrate projection). Engine's
    // BRRRRAnalysis shape (see backend/src/services/investment/brrrAnalyzer.ts):
    //   strategySpecific.refinanceResults.newLoanAmount   ← was reading "refinanceLoanAmount"
    //   strategySpecific.capitalRecovery.capitalRecovered
    //   strategySpecific.capitalRecovery.capitalRemaining
    //   strategySpecific.capitalRecovery.capitalRecoveryRate
    //   strategySpecific.capitalRecovery.infiniteReturn
    //   strategySpecific.postRefinanceMetrics.monthlyCashFlow
    //   strategySpecific.postRefinanceMetrics.postRefiDSCR ← was reading "dscr"
    // Prior code read the wrong names, always fell back to inline math,
    // which produced 83.8% recovery in the workspace vs 93% (Method A)
    // in the chat narrative — same deal, two answers.
    const refiLoan = engineRefinance?.newLoanAmount
      ? Number(engineRefinance.newLoanAmount)
      : arv * (refiLTV / 100);
    const originalLoanBalance = Math.max(0, purchasePrice - downPayment);
    const capitalRecoveredAtRefi = engineCapitalRecovery?.capitalRecovered
      ? Number(engineCapitalRecovery.capitalRecovered)
      : Math.max(0, refiLoan - originalLoanBalance);
    const capitalRemaining = engineCapitalRecovery?.capitalRemaining
      ? Number(engineCapitalRecovery.capitalRemaining)
      : Math.max(0, allInTotalCash - capitalRecoveredAtRefi);
    const capitalRecoveryPct = engineCapitalRecovery?.capitalRecoveryRate
      ? Number(engineCapitalRecovery.capitalRecoveryRate)
      : allInTotalCash > 0
        ? Math.min(100, (capitalRecoveredAtRefi / allInTotalCash) * 100)
        : 0;
    const meets70Rule =
      engineRule70?.meets70Rule !== undefined
        ? Boolean(engineRule70.meets70Rule)
        : arv > 0
          ? allInRule70 <= arv * 0.7
          : false;
    const rule70Threshold = arv * 0.7;
    const postRefiCashFlow = enginePostRefi?.monthlyCashFlow
      ? Number(enginePostRefi.monthlyCashFlow)
      : undefined;
    const postRefiDscr = enginePostRefi?.postRefiDSCR
      ? Number(enginePostRefi.postRefiDSCR)
      : undefined;
    const infiniteReturn = engineCapitalRecovery?.infiniteReturn === true;

    brrrrRows = [
      { label: 'Rehab budget', value: fmtCurrency(rehabBudget) },
      { label: 'After-repair value (ARV)', value: fmtCurrency(arv) },
      { label: 'Total cash deployed (DP + rehab + closing)', value: fmtCurrency(allInTotalCash) },
      {
        label: '70% rule (purchase + rehab ≤ 70% × ARV)',
        value: arv > 0
          ? `${fmtCurrency(allInRule70)} vs ${fmtCurrency(rule70Threshold)} — ${meets70Rule ? '✓ meets' : '✗ over'}`
          : '–',
        negative: arv > 0 && !meets70Rule,
        hint: 'Classic BRRRR underwriting filter: keep total acquisition (price + rehab, excluding closing) under 70% of the projected after-repair value. Leaves headroom for refi appraisal slippage + capital recovery.',
      },
      { label: 'Refi LTV', value: `${refiLTV.toFixed(0)}%` },
      {
        label: 'Refi loan (ARV × LTV)',
        value: fmtCurrency(refiLoan),
        hint: 'Estimated cash-out refinance loan amount, assuming the appraiser hits the projected ARV and the lender funds at the modeled LTV.',
      },
      { label: 'Estimated refi rate', value: refiRate > 0 ? fmtPct(refiRate) : '–' },
      { label: 'Seasoning before refi', value: `${seasoning} mo` },
      {
        label: 'Capital recovered at refi',
        value: fmtCurrency(capitalRecoveredAtRefi),
        hint: 'Refi loan minus the original purchase loan balance — the cash that flows back to you at refinance.',
      },
      {
        label: 'Capital remaining in deal',
        value: fmtCurrency(capitalRemaining),
        hint: 'Cash you have left invested AFTER the refi. If this is ~$0 or negative, you have an "infinite return" — every dollar of return is on no remaining capital.',
      },
      {
        label: 'Capital recovery rate',
        value: `${capitalRecoveryPct.toFixed(1)}%`,
        hint: 'Capital recovered ÷ total cash deployed. 100% = full BRRRR (capital fully recycled). <100% = partial recovery.',
      },
    ];
    // Phase 2.5 (Issue #205) — engine-only rows. Show these when the
    // BRRRRAnalyzer wrote postRefinanceMetrics + capitalRecovery to
    // substrate. Deals saved before #205 won't have them; the inline-
    // derived rows above still render meaningfully.
    if (typeof postRefiCashFlow === 'number') {
      brrrrRows.push({
        label: 'Post-refi monthly cash flow',
        value: fmtCurrency(postRefiCashFlow),
        negative: isNeg(postRefiCashFlow),
        hint: 'Monthly cash flow AFTER the cash-out refinance. Refi loan is bigger AND has a higher rate, so post-refi cash flow is usually thinner than the pre-refi rental phase.',
      });
    }
    if (typeof postRefiDscr === 'number') {
      brrrrRows.push({
        label: 'Post-refi DSCR',
        value: fmtRatio(postRefiDscr),
        negative: postRefiDscr < 1.2,
        hint: 'Debt service coverage ratio on the cash-out refi loan. <1.20 is lender-uncomfortable territory.',
      });
    }
    if (infiniteReturn) {
      brrrrRows.push({
        label: 'Infinite return',
        value: '✓ yes',
        hint: 'Capital recovered at refi ≥ total cash deployed. Every dollar of subsequent return is on no remaining capital — that\'s the BRRRR endgame.',
      });
    }
  }

  // Issue #211 (2026-06-30) — strategy-aware Financials.
  //
  // For BUY-HOLD deals: show acquisition-loan operational picture from
  // monthlyAnalysis (rent, opex, acquisition debt, cash flow, DSCR).
  //
  // For BRRRR deals: show POST-REFI operational picture from
  // strategySpecific.postRefinanceMetrics. That's what the investor
  // actually lives with for 10 years after the refi closes at month 12
  // — showing the acquisition-loan cash flow (nice + positive $353/mo)
  // hid the fact that the post-refi loan is bigger AND higher-rate,
  // producing negative cash flow (-$358/mo) and unlendable DSCR (0.61)
  // on the Test 1 Garland deal.
  //
  // Reads from the same `enginePostRefi` block used by the BRRRR plan
  // section above so the two sections agree on every metric.
  // Issue #101 (2026-07-06) — BRRRR display needs an extra "Less: Management"
  // line so on-screen math reconciles with the engine's post-refi cash flow.
  // Convention (Issue #67): BRRRR opex EXCLUDES property management fee
  // (management is an above-the-line EGI deduction, per Fannie Mae). But the
  // shared `monthlyAnalysis.income.effective` field only nets out vacancy —
  // it doesn't know about the management deduction. So we compute management
  // inline here and expose it as its own line.
  //
  // Buy-hold path (below) doesn't need this because buy-hold opex INCLUDES
  // management, so its `Effective income − OpEx − Debt = CashFlow` already
  // ties.
  const propertyManagementRate =
    typeof pd.propertyManagementRate === 'number' ? pd.propertyManagementRate : undefined;
  const managementMonthly =
    typeof grossMonthly === 'number' && typeof propertyManagementRate === 'number'
      ? (grossMonthly * propertyManagementRate) / 100
      : undefined;
  const brrrrDisplayEffectiveIncome =
    typeof grossMonthly === 'number' &&
    typeof vacancyMonthly === 'number' &&
    typeof managementMonthly === 'number'
      ? grossMonthly - vacancyMonthly - managementMonthly
      : effectiveMonthly; // Fallback to vacancy-only if PM rate missing (older deals)

  const financials: Row[] = isBrrrr && enginePostRefi
    ? [
        { label: 'Gross monthly income', value: fmtCurrency(grossMonthly) },
        {
          label:
            typeof vacancyRate === 'number'
              ? `Less: Vacancy (${vacancyRate.toFixed(1)}%)`
              : 'Less: Vacancy',
          value:
            typeof vacancyMonthly === 'number'
              ? `−${fmtCurrency(vacancyMonthly)}`
              : '–',
          negative: true,
        },
        {
          label:
            typeof propertyManagementRate === 'number'
              ? `Less: Management (${propertyManagementRate.toFixed(1)}%)`
              : 'Less: Management',
          value:
            typeof managementMonthly === 'number'
              ? `−${fmtCurrency(managementMonthly)}`
              : '–',
          negative: true,
          hint: 'Property management fee treated as an above-the-line deduction (Fannie Mae methodology). Buy-hold folds this into Operating expenses instead — same total, different presentation.',
        },
        { label: 'Effective income', value: fmtCurrency(brrrrDisplayEffectiveIncome) },
        {
          label: 'Operating expenses',
          value: fmtCurrency(Number(enginePostRefi.monthlyOperatingExpenses)),
          hint: 'Post-refi operating expenses — property tax, insurance, maintenance, CapEx reserve, HOA, utilities, turnover. Excludes management (shown above the line).',
        },
        {
          label: 'Debt service (post-refi mortgage)',
          value: fmtCurrency(Number(enginePostRefi.newMonthlyPayment)),
          hint: 'Monthly P&I on the cash-out refi loan (ARV × refi LTV), amortized at the refi rate. Higher than the acquisition loan payment because the loan is bigger AND the rate is higher (200bps spread on cash-out DSCR products).',
        },
        {
          label: 'Monthly cash flow (post-refi)',
          value: fmtCurrency(Number(enginePostRefi.monthlyCashFlow)),
          negative: isNeg(Number(enginePostRefi.monthlyCashFlow)),
          hint: 'Cash flow AFTER the refi closes at month 12. This is what you live with for the 10-year hold. Negative = the property bleeds cash every month.',
        },
        {
          // Cap rate (BRRRR) uses ARV as denominator, not purchase price.
          // ARV reflects the post-rehab market value the property actually
          // produces income against. Purchase-price-based cap rate would
          // be artificially inflated because BRRRR pays a distressed price.
          label: 'Cap rate (BRRRR, ARV-based)',
          value:
            Number(brrrrBlock?.afterRepairValue) > 0
              ? fmtPct((Number(enginePostRefi.annualNOI) / Number(brrrrBlock!.afterRepairValue)) * 100)
              : '–',
          hint: 'Annual post-refi NOI ÷ ARV. ARV is the correct denominator for BRRRR — purchase price is what you paid pre-rehab, ARV is what the property is worth as an income-producing asset.',
        },
        {
          label: 'Cash-on-cash (post-refi)',
          value: fmtPct(Number(enginePostRefi.cashOnCashReturn)),
          hint: 'Annual post-refi cash flow ÷ capital remaining in deal after refi. Different denominator than buy-hold cash-on-cash — a BRRRR-specific view.',
        },
        {
          label: 'DSCR (post-refi)',
          value: fmtRatio(Number(enginePostRefi.postRefiDSCR)),
          negative: Number(enginePostRefi.postRefiDSCR) < 1.2,
          hint: 'Debt service coverage ratio on the refi loan. Lenders typically require ≥1.20 for cash-out refi approval. <1.0 means the deal literally cannot be refinanced — the whole BRRRR strategy is theoretical.',
        },
        {
          label: 'Annual NOI (post-refi)',
          value: fmtCurrency(Number(enginePostRefi.annualNOI)),
          hint: 'Post-refi NOI = effective annual rent − operating expenses. Pre-debt-service.',
        },
      ]
    : [
        // Buy-hold path — unchanged.
        { label: 'Gross monthly income', value: fmtCurrency(grossMonthly) },
        {
          label:
            typeof vacancyRate === 'number'
              ? `Less: Vacancy (${vacancyRate.toFixed(1)}%)`
              : 'Less: Vacancy',
          value:
            typeof vacancyMonthly === 'number'
              ? `−${fmtCurrency(vacancyMonthly)}`
              : '–',
          negative: true,
        },
        { label: 'Effective income', value: fmtCurrency(effectiveMonthly) },
        {
          label: 'Operating expenses',
          value: fmtCurrency(nestedNum(ma, 'expenses', 'operating')),
          hint: 'Includes property tax, insurance, maintenance, mgmt, vacancy, and a CapEx reserve (~5% of rent). Some Wall Street SFR models put CapEx below NOI; we use the more conservative Fannie Mae multifamily convention.',
        },
        { label: 'Debt service (mortgage)', value: fmtCurrency(nestedNum(ma, 'expenses', 'debt')) },
        {
          label: 'Monthly cash flow',
          value: fmtCurrency(monthlyCashFlow),
          negative: isNeg(monthlyCashFlow),
        },
        { label: 'Cap rate', value: fmtPct(num(m, 'capRate')) },
        { label: 'Cash-on-cash', value: fmtPct(num(m, 'cashOnCashReturn')) },
        { label: 'DSCR', value: fmtRatio(num(m, 'dscr')) },
        {
          label: 'Annual NOI',
          value: fmtCurrency(num(m, 'noi') ?? num(m, 'annualNOI')),
          hint: 'NOI = effective rent minus operating expenses (incl. CapEx reserve). Pre-debt-service. Same convention as Fannie Mae multifamily underwriting — more conservative than Wall Street SFR which puts CapEx below NOI (and would show a higher number).',
        },
      ];

  const totalCashFlow = num(returns, 'totalCashFlow');

  // Issue #211 Step 2 (2026-06-30) — strategy-aware Long-term view.
  //
  // For BRRRR: read from strategySpecific.exitScenarios (BRRRRAnalyzer's
  // exit-scenario calculator, which correctly accounts for the refi cash-
  // out at Y1 + negative post-refi cash flow through the hold + sale
  // proceeds at exit). Match the hold period to the closest exit scenario
  // year (standard scenarios: [3, 5, 7, 10, 15]).
  //
  // Buy-hold path unchanged — reads from returns/exit from
  // longTermAnalysis.projections (SFRAnalyzer).
  const engineExitScenarios =
    strategySpecific && Array.isArray(strategySpecific.exitScenarios)
      ? (strategySpecific.exitScenarios as Array<Record<string, unknown>>)
      : null;
  const holdPeriod = typeof lt.projectionYears === 'number' ? lt.projectionYears : 10;
  // Pick the exit scenario closest to the hold period (typically exact
  // match at Y10; fall back to closest available).
  const brrrExit =
    engineExitScenarios && engineExitScenarios.length > 0
      ? engineExitScenarios.reduce((best, cur) => {
          const bestDist = Math.abs(Number(best.year) - holdPeriod);
          const curDist = Math.abs(Number(cur.year) - holdPeriod);
          return curDist < bestDist ? cur : best;
        }, engineExitScenarios[0])
      : null;

  const longTerm: Row[] = isBrrrr && brrrExit
    ? [
        {
          label: 'Hold period',
          value: `${Number(brrrExit.year)} yr`,
        },
        {
          label: 'IRR (BRRRR exit)',
          // engine's ExitScenario.irr is a DECIMAL (0.0387 for 3.87%).
          // fmtIrr() already does `v * 100`. Pass the decimal directly
          // — the prior `Number(brrrExit.irr) * 100` was double-multiplying,
          // showing 386.76% instead of 3.87%.
          value: fmtIrr(brrrExit.irr),
          hint: 'IRR on the BRRRR structure — includes the refi cash-out at Y1, ongoing post-refi cash flow (may be negative), and net sale proceeds at exit. Buy-hold IRR on the same property would be different (and usually higher) but doesn\'t reflect the BRRRR strategy the user is actually running.',
        },
        {
          label: 'Cumulative cash flow',
          value: fmtCurrency(Number((brrrExit.breakdown as Record<string, unknown>).cumulativeCashFlow)),
          negative: isNeg(Number((brrrExit.breakdown as Record<string, unknown>).cumulativeCashFlow)),
          hint: 'Sum of post-refi monthly cash flows from Y1 through exit. Negative if the property bleeds cash every month (like the Test 1 Garland deal).',
        },
        {
          label: 'Capital recovered at refi',
          value: fmtCurrency(Number((brrrExit.breakdown as Record<string, unknown>).capitalRecovered)),
          hint: 'Cash pulled at the Y1 refi. Counted as return OF capital, not return ON capital.',
        },
        {
          label: 'Appreciation over hold',
          value: fmtCurrency(Number((brrrExit.breakdown as Record<string, unknown>).appreciation)),
        },
        {
          label: 'Principal paid down',
          value: fmtCurrency(Number((brrrExit.breakdown as Record<string, unknown>).principalPaid)),
        },
        {
          label: 'Total profit',
          value: fmtCurrency(Number(brrrExit.totalProfit)),
          negative: isNeg(Number(brrrExit.totalProfit)),
        },
        {
          label: 'Total return %',
          value: `${Number(brrrExit.totalReturn).toFixed(1)}%`,
        },
        {
          label: 'Projected sale price',
          value: fmtCurrency(Number(brrrExit.salePrice)),
        },
        {
          label: 'Net proceeds at exit',
          value: fmtCurrency(Number(brrrExit.netProceeds)),
        },
      ]
    : [
        // Buy-hold path — unchanged.
        {
          label: 'Hold period',
          value: typeof lt.projectionYears === 'number' ? `${lt.projectionYears} yr` : '–',
        },
        { label: 'IRR', value: fmtIrr(num(returns, 'irr')) },
        {
          label: 'Total cash flow',
          value: fmtCurrency(totalCashFlow),
          negative: isNeg(totalCashFlow),
        },
        { label: 'Total appreciation', value: fmtCurrency(num(returns, 'totalAppreciation')) },
        { label: 'Total return', value: fmtCurrency(num(returns, 'totalReturn')) },
        { label: 'Projected sale price', value: fmtCurrency(num(exit, 'projectedSalePrice')) },
        { label: 'Net proceeds at exit', value: fmtCurrency(num(exit, 'netProceedsFromSale')) },
      ];

  const detailsLabel = scenarioName
    ? `Details · ${scenarioName}`
    : 'Details · selected scenario';

  return (
    <WorkspaceSection label={detailsLabel}>
      {brrrrRows.length > 0 && (
        <Section
          title="BRRRR plan"
          open={openSection === 'brrrr'}
          onToggle={() => setOpenSection((s) => (s === 'brrrr' ? null : 'brrrr'))}
          rows={brrrrRows}
        />
      )}
      <Section
        title="Financials"
          open={openSection === 'financials'}
          onToggle={() => setOpenSection((s) => (s === 'financials' ? null : 'financials'))}
          rows={financials}
          borderTop={brrrrRows.length > 0}
        />
        <Section
          title="Long-term"
          open={openSection === 'longterm'}
          onToggle={() => setOpenSection((s) => (s === 'longterm' ? null : 'longterm'))}
          rows={longTerm}
          borderTop
        />
        {/* Issue #211 Step 3 (2026-06-30) — strategy-aware projection.
            BRRRR deals show engine-computed exit scenarios (years 3/5/7/10/15
            with post-refi cumulative cash flow, sale price, net proceeds,
            profit, IRR). Buy-hold deals show the year-by-year projection
            from longTermAnalysis.projections. On a BRRRR deal, the buy-hold
            year-by-year would misleadingly show acquisition-loan operational
            economics (positive cash flow, growing equity as if the acquisition
            loan pays down normally) instead of the post-refi picture the
            investor actually lives with. */}
        {isBrrrr && engineExitScenarios && engineExitScenarios.length > 0 ? (
          <BrrrrExitScenariosSection
            open={openSection === 'projection'}
            onToggle={() =>
              setOpenSection((s) => (s === 'projection' ? null : 'projection'))
            }
            scenarios={engineExitScenarios}
          />
        ) : projections.length > 0 ? (
          <ProjectionSection
            open={openSection === 'projection'}
            onToggle={() =>
              setOpenSection((s) => (s === 'projection' ? null : 'projection'))
            }
            projections={projections}
          />
        ) : null}
        {hasMarket && (
          <Section
            title="Market"
            open={openSection === 'market'}
            onToggle={() => setOpenSection((s) => (s === 'market' ? null : 'market'))}
            rows={market}
            borderTop
          />
        )}
        {comps.length > 0 && (
          <ComparablesSection
            open={openSection === 'comparables'}
            onToggle={() =>
              setOpenSection((s) => (s === 'comparables' ? null : 'comparables'))
            }
            comparables={comps}
          />
        )}
    </WorkspaceSection>
  );
}

function Section({
  title,
  open,
  onToggle,
  rows,
  borderTop,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  rows: Row[];
  borderTop?: boolean;
}): React.JSX.Element {
  return (
    <Box sx={{ borderTop: borderTop ? '1px solid' : 'none', borderColor: 'divider' }}>
      <SectionHeader title={title} open={open} onToggle={onToggle} />
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 1.5 }}>
          {rows.map(({ label, value, negative, hint }) => (
            <Box
              key={label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.5,
                borderTop: '1px solid',
                borderColor: 'grey.100',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
                {hint && (
                  <Tooltip title={hint} placement="top" arrow enterTouchDelay={0}>
                    <InfoOutlinedIcon
                      sx={{
                        fontSize: 14,
                        color: 'text.disabled',
                        cursor: 'help',
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: negative ? 'error.main' : 'text.primary',
                }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Year-by-year projection table — the substrate's longTermAnalysis.projections
 * (YearlyProjection[]). This is the depth the legacy "Long-term Analysis" tab
 * rendered (and which broke to "No Projection Data Available"); the data was
 * in the substrate all along. Horizontally scrollable on mobile with a sticky
 * Year column.
 */
function ProjectionSection({
  open,
  onToggle,
  projections,
}: {
  open: boolean;
  onToggle: () => void;
  projections: Array<Record<string, unknown>>;
}): React.JSX.Element {
  const cols: Array<{ key: string; label: string }> = [
    { key: 'cashFlow', label: 'Cash flow' },
    { key: 'noi', label: 'NOI' },
    { key: 'equity', label: 'Equity' },
    { key: 'propertyValue', label: 'Value' },
    { key: 'totalReturn', label: 'Total return' },
  ];

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Year-by-year projection" open={open} onToggle={onToggle} />
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 2, overflowX: 'auto' }}>
          <Box
            component="table"
            sx={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 520,
              '& th, & td': {
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
                py: 0.75,
                px: 1,
                whiteSpace: 'nowrap',
                borderTop: '1px solid',
                borderColor: 'grey.100',
              },
              '& th': {
                color: 'text.secondary',
                fontWeight: 600,
                position: 'sticky',
                top: 0,
              },
              // Year column: left-aligned + sticky so it stays in view while scrolling.
              '& th:first-of-type, & td:first-of-type': {
                textAlign: 'left',
                position: 'sticky',
                left: 0,
                bgcolor: 'background.paper',
                fontWeight: 600,
              },
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box component="th">Year</Box>
                {cols.map((c) => (
                  <Box component="th" key={c.key}>
                    {c.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {projections.map((p, i) => {
                const cf = p.cashFlow;
                return (
                  <Box component="tr" key={(p.year as number) ?? i}>
                    <Box component="td">{(p.year as number) ?? i + 1}</Box>
                    {cols.map((c) => (
                      <Box
                        component="td"
                        key={c.key}
                        sx={{
                          color:
                            c.key === 'cashFlow' && isNeg(cf) ? 'error.main' : 'text.primary',
                        }}
                      >
                        {fmtCurrency(p[c.key])}
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Issue #211 Step 3 (2026-06-30) — BRRRR exit scenarios table.
 *
 * Renders the engine's exit-scenario array (BRRRRAnalyzer.calculateExitScenarios)
 * as a small 5-row table at years [3, 5, 7, 10, 15]. Each row shows what
 * happens if you sell at that exit year — cumulative post-refi cash flow,
 * sale price, net proceeds after selling costs + mortgage payoff, total
 * profit including capital recovered at refi, and IRR.
 *
 * Replaces the buy-hold year-by-year projection on BRRRR deals. The buy-hold
 * projection would misleadingly show acquisition-loan operational economics
 * (positive cash flow, growing equity as if the acquisition loan pays down
 * normally) instead of the post-refi picture the investor actually lives
 * with for 10+ years.
 */
function BrrrrExitScenariosSection({
  open,
  onToggle,
  scenarios,
}: {
  open: boolean;
  onToggle: () => void;
  scenarios: Array<Record<string, unknown>>;
}): React.JSX.Element {
  const cols: Array<{ key: string; label: string; extract: (s: Record<string, unknown>) => number }> = [
    {
      key: 'cumulativeCashFlow',
      label: 'Cash flow (cum)',
      extract: (s) => Number((s.breakdown as Record<string, unknown>).cumulativeCashFlow),
    },
    { key: 'salePrice', label: 'Sale price', extract: (s) => Number(s.salePrice) },
    { key: 'netProceeds', label: 'Net proceeds', extract: (s) => Number(s.netProceeds) },
    { key: 'totalProfit', label: 'Total profit', extract: (s) => Number(s.totalProfit) },
    {
      key: 'irr',
      // engine's ExitScenario.irr is a DECIMAL (0.0543 for 5.43%) —
      // multiply by 100 for display, same fix as #208.
      label: 'IRR',
      extract: (s) => Number(s.irr) * 100,
    },
  ];

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Exit scenarios (BRRRR)" open={open} onToggle={onToggle} />
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 2, overflowX: 'auto' }}>
          <Box
            component="table"
            sx={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 520,
              '& th, & td': {
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
                py: 0.75,
                px: 1,
                whiteSpace: 'nowrap',
                borderTop: '1px solid',
                borderColor: 'grey.100',
              },
              '& th': {
                color: 'text.secondary',
                fontWeight: 600,
                position: 'sticky',
                top: 0,
              },
              '& th:first-of-type, & td:first-of-type': {
                textAlign: 'left',
                position: 'sticky',
                left: 0,
                bgcolor: 'background.paper',
                fontWeight: 600,
              },
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box component="th">Exit year</Box>
                {cols.map((c) => (
                  <Box component="th" key={c.key}>
                    {c.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {scenarios.map((s, i) => (
                <Box component="tr" key={(s.year as number) ?? i}>
                  <Box component="td">Y{(s.year as number) ?? i + 1}</Box>
                  {cols.map((c) => {
                    const val = c.extract(s);
                    return (
                      <Box
                        component="td"
                        key={c.key}
                        sx={{
                          color:
                            (c.key === 'cumulativeCashFlow' || c.key === 'totalProfit' || c.key === 'irr') &&
                            val < 0
                              ? 'error.main'
                              : 'text.primary',
                        }}
                      >
                        {c.key === 'irr' ? `${val.toFixed(2)}%` : fmtCurrency(val)}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Comparable sales table — the substrate's marketData.comparables
 * (ComparableProperty[]), the depth the legacy "Comparables" tab showed.
 * Horizontally scrollable with a sticky Address column. Snapshot frozen at
 * analysis time, so it reflects the comps as of when this scenario was scored.
 */
function ComparablesSection({
  open,
  onToggle,
  comparables,
}: {
  open: boolean;
  onToggle: () => void;
  comparables: ScenarioComparableWire[];
}): React.JSX.Element {
  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      <SectionHeader
        title={`Comparable sales (${comparables.length})`}
        open={open}
        onToggle={onToggle}
      />
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 2, overflowX: 'auto' }}>
          <Box
            component="table"
            sx={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 560,
              '& th, & td': {
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
                py: 0.75,
                px: 1,
                whiteSpace: 'nowrap',
                borderTop: '1px solid',
                borderColor: 'grey.100',
              },
              '& th': { color: 'text.secondary', fontWeight: 600 },
              '& th:first-of-type, & td:first-of-type': {
                textAlign: 'left',
                position: 'sticky',
                left: 0,
                bgcolor: 'background.paper',
                fontWeight: 600,
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box component="th">Address</Box>
                <Box component="th">Sale price</Box>
                <Box component="th">$/sqft</Box>
                <Box component="th">Bed/Bath</Box>
                <Box component="th">Sqft</Box>
                <Box component="th">DOM</Box>
                <Box component="th">Distance</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {comparables.map((c, i) => (
                <Box component="tr" key={c.address ?? i}>
                  <Box component="td" title={c.address}>
                    {fmtText(c.address)}
                  </Box>
                  <Box component="td">{fmtCurrency(c.salePrice)}</Box>
                  <Box component="td">{fmtCurrency(c.pricePerSqft)}</Box>
                  <Box component="td">
                    {fmtNum(c.bedrooms)} / {fmtNum(c.bathrooms)}
                  </Box>
                  <Box component="td">{fmtNum(c.sqft)}</Box>
                  <Box component="td">{fmtNum(c.daysOnMarket)}</Box>
                  <Box component="td">{fmtMiles(c.distance)}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

/** Shared collapsible header row (chevron rotates on open). */
function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}): React.JSX.Element {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggle();
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
      <Box
        sx={{
          color: 'text.secondary',
          fontSize: 12,
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s ease',
        }}
      >
        ▸
      </Box>
    </Box>
  );
}
