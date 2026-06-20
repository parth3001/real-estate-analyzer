/**
 * SavedDealHero — the chat-style summary card at the top of /analysis/:id.
 *
 * Phase 4 / Issue #117 (UX Designer call 2026-05-17):
 *
 * When a user clicks a saved property from the new sidebar, they
 * expect to see the same DealScoreCard they saw in the chat — that's
 * the continuity moment. SavedDealHero is that card, rendered above
 * the legacy SFRAnalysis tabs which become the deep-dive surface.
 *
 * Polymorphism (per the UX Designer pass): the same visual shell
 * adapts to 4 deal variants:
 *   - SFR Buy & Hold     (default)
 *   - SFR BRRRR          (different factor priorities, ARV-aware chips)
 *   - SFR House Hack     (owner-occupied framing)
 *   - Multi-Family       (different engine, different metrics)
 *
 * Each variant's caption / factor selection / action chips are
 * config-driven via `savedDealVariants.ts` — adding a 5th variant
 * (commercial later) is a single config entry, no card code change.
 *
 * Chip taps route the user to /app with the chip text as the next
 * chat prompt. The agent handles the natural-language reference
 * ("Stress-test 336 Highland Ridge at 7%") via its recall_user_context
 * flow — no decisionId surfaced to the user (Issue #116 guardrail).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Stack } from '@mui/material';
import { DealScoreCard, type DealScoreCardFactor } from '../Chat/DealScoreCard';
import {
  detectSavedDealVariant,
  buildVariantCaption,
  getVariantFactors,
  getVariantChips,
  getDealQualityScore,
  getProfessionalAssessment,
  getPrimaryReason,
  getProjectionMilestones,
  type SavedDealShape,
} from './savedDealVariants';
import { CritiqueCard } from './CritiqueCard';
import { LicenseStatusBadge } from './LicenseStatusBadge';
import { AiDisclaimer } from '../AiDisclaimer';
import {
  propertyApi,
  type CritiqueWire,
  type LicenseStatusWire,
  type ScenarioFactorScores,
} from '../../services/api';

/**
 * Map a scenario's resolved assumptions (substrate AnalysisAssumptions
 * shape) to the DealScoreCard's display rows (Task #18, 2026-05-21).
 * Only includes fields actually present. Empty input → [] (toggle hides).
 */
function buildAssumptionRows(
  a: Record<string, unknown> | undefined
): React.ComponentProps<typeof DealScoreCard>['assumptions'] {
  if (!a) return [];
  const rows: { label: string; value?: string; source?: string }[] = [];
  const pct = (v: unknown, suffix = '%'): string | undefined =>
    typeof v === 'number' ? `${parseFloat(v.toFixed(2))}${suffix}` : undefined;
  const push = (label: string, value?: string): void => {
    if (value !== undefined) rows.push({ label, value, source: 'standard' });
  };
  push('Vacancy', pct(a.vacancyRate));
  push(
    'Hold period',
    typeof a.projectionYears === 'number' ? `${a.projectionYears} yr` : undefined
  );
  push('Rent growth', pct(a.annualRentIncrease, '%/yr'));
  push('Appreciation', pct(a.annualPropertyValueIncrease, '%/yr'));
  push('Expense growth', pct(a.annualExpenseIncrease, '%/yr'));
  push('Selling costs', pct(a.sellingCosts));
  return rows;
}

export interface SavedDealHeroProps {
  deal: SavedDealShape;
  /**
   * Optional selected-scenario override (Task #8, 2026-05-21). When the
   * scenario list selects a scenario, the hero reflects THAT scenario's
   * score / factors / walk-away / price instead of the deal's default
   * (latest). Absent → the hero shows the deal default. This is what makes
   * the page scenario-scoped: selecting a row re-points the hero.
   */
  selectedScenario?: {
    dealQuality: number;
    factorScores: ScenarioFactorScores;
    walkAwayPrice?: number;
    purchasePrice?: number;
    /** Resolved assumptions for the selected scenario (Task #18). */
    assumptions?: Record<string, unknown>;
  };
}

export function SavedDealHero(props: SavedDealHeroProps): React.JSX.Element {
  const { deal } = props;
  const navigate = useNavigate();

  // ===== Variant detection + content selection =====
  const variant = detectSavedDealVariant(deal);
  const caption = buildVariantCaption(variant, deal);
  const variantFactors = getVariantFactors(variant);
  const variantChips = getVariantChips(variant);

  // ===== Adversarial critique fetch (T1 — Issue #97 frontend) =====
  //
  // Auto-fires on every save (backend triggerOnSave.ts). We fetch on
  // mount and on dealId change. The state shape mirrors the backend
  // wire shape: critiques[] + pending boolean. Loading is its own
  // local state — distinct from pending (which is a server-side
  // signal that the background job is still running).
  //
  // We don't poll. Critique typically completes in 5–15s after save;
  // the user reaching SavedDealHero will land BEFORE the critique
  // populates if they refresh fast, but the section just shows
  // "Review in progress" — the next page load picks it up.
  const dealId = deal._id;
  const [critiques, setCritiques] = useState<CritiqueWire[]>([]);
  const [critiquePending, setCritiquePending] = useState(false);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueFromPriorDecision, setCritiqueFromPriorDecision] = useState(false);
  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;
    setCritiqueLoading(true);
    propertyApi
      .getDealCritique(dealId)
      .then((res) => {
        if (cancelled) return;
        setCritiques(res.data.critiques);
        setCritiquePending(res.data.pending);
        setCritiqueFromPriorDecision(res.data.fromPriorDecision === true);
      })
      .catch(() => {
        // Silent failure — the section just doesn't render. We don't
        // want a critique-endpoint outage to mar the saved-deal page
        // (which is the user's primary surface). Console logs in api.ts
        // are sufficient for debugging.
        if (!cancelled) {
          setCritiques([]);
          setCritiquePending(false);
        }
      })
      .finally(() => {
        if (!cancelled) setCritiqueLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  // ===== License-status fetch (Day 10) =====
  //
  // Powers the LicenseStatusBadge above the DealScoreCard. Same fetch
  // shape as the critique: one-shot on mount + dealId change, silent
  // failure, refetchable on demand (via `refetchLicense` — used by
  // the dev-seed button to pick up the new license without a page
  // reload).
  const [license, setLicense] = useState<LicenseStatusWire | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseRefetchTick, setLicenseRefetchTick] = useState(0);
  const refetchLicense = (): void => setLicenseRefetchTick((n) => n + 1);
  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;
    setLicenseLoading(true);
    propertyApi
      .getDealLicense(dealId)
      .then((res) => {
        if (cancelled) return;
        setLicense(res.data);
      })
      .catch(() => {
        if (!cancelled) setLicense(null);
      })
      .finally(() => {
        if (!cancelled) setLicenseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId, licenseRefetchTick]);

  // ===== Data extraction (defensive — older legacy deals may have
  //   different field shapes; missing data renders gracefully) =====
  // Task #8 (2026-05-21): when a scenario is selected, the hero reflects
  // THAT scenario — its score, factor scores, walk-away, and price — instead
  // of the deal's default (latest). Absent selectedScenario → deal default.
  const sel = props.selectedScenario;
  const dealQuality = sel?.dealQuality ?? getDealQualityScore(deal);
  const pa = sel
    ? ({
        dealQuality: sel.dealQuality,
        cashFlowScore: sel.factorScores.cashFlow,
        irrScore: sel.factorScores.irr,
        marketStrengthScore: sel.factorScores.marketStrength,
        debtStructureScore: sel.factorScores.debtStructure,
        exitStrategyScore: sel.factorScores.exitStrategy,
        capRateScore: sel.factorScores.capRate,
        propertyRiskScore: sel.factorScores.propertyRisk,
      } as ReturnType<typeof getProfessionalAssessment>)
    : getProfessionalAssessment(deal);
  const primaryReason = getPrimaryReason(deal);

  // Build factor data — each variant config tells us which 3 scores
  // to read off professionalAssessment. If a score is missing (older
  // deal), we surface 0 + the label so the bar is empty (honest about
  // missing data) rather than dropping the row.
  const topFactors: DealScoreCardFactor[] = variantFactors.map((vf) => ({
    label: vf.label,
    score:
      (pa?.[vf.scoreField] as number | undefined) !== undefined
        ? Math.round(Number(pa?.[vf.scoreField]))
        : 0,
  }));

  // Walk-away vs purchase. For BRRRR we'd ideally show "ARV vs
  // purchase + rehab" but the DealScoreCard's two-row component is
  // shaped for walk-away. Until we extend the card with a variant-
  // aware comparison row, BRRRR uses the same walk-away framing as
  // buy-hold (the engine still computes a walk-away for BRRRR; it's
  // just not the most-informative metric for that strategy).
  // Selected scenario overrides price + walk-away (both scenario-dependent).
  const purchasePrice = sel?.purchasePrice ?? deal.purchasePrice ?? 0;
  // walkAwayPrice was the bug-source in Issue #114. We read defensively
  // from any place the engine might have stashed it. If absent, fall
  // back to 0 (DealScoreCard handles 0 by suppressing the delta).
  const walkAwayPrice =
    sel?.walkAwayPrice ??
    (deal as { walkAwayPrice?: number }).walkAwayPrice ??
    (deal.analysis as { walkAwayPrice?: number } | undefined)?.walkAwayPrice ??
    0;

  // Next-step copy: prefer the engine's primaryReason; fall back to
  // a generic that uses the variant label so it stays on-brand.
  const nextStep =
    primaryReason ||
    `Review the ${variant.replace(/_/g, ' ')} analysis below for details.`;

  // Address — defensive against missing fields
  const address = {
    street: deal.propertyAddress?.street ?? '',
    city: deal.propertyAddress?.city ?? '',
    state: deal.propertyAddress?.state ?? '',
  };

  // ===== Assumptions row =====
  //
  // Task #18 (2026-05-21): populate from the selected scenario's resolved
  // assumptions (now returned by the scenario-detail endpoint from the
  // substrate AnalysisEvent.payload.assumptions). Previously hardcoded []
  // because materialized Deals didn't carry them — now they do, per
  // scenario. Empty list (e.g., no selectedScenario) hides the toggle.
  const assumptions = buildAssumptionRows(sel?.assumptions);

  // ===== 10-year projection (Issue #112) =====
  //
  // Read the milestone-sampled projection from the Deal's
  // analysis.longTermAnalysis.yearlyProjections. The helper mirrors
  // the backend chat-flow sampler so both surfaces show the same
  // 1/3/5/7/10-year anchor rows.
  const projection = getProjectionMilestones(deal);

  // ===== Chip tap handler =====
  //
  // Routes to /app with the chip text as initialUserInput. AppPage's
  // existing path mounts ChatOverlay with that input, which auto-
  // submits as turn 1. The agent handles the natural-language
  // reference; no decisionId needs to leak to the user (#116).
  const handleChipTap = (chipText: string): void => {
    const propertyContext = [
      deal.propertyAddress?.street,
      deal.propertyAddress?.city,
      deal.propertyAddress?.state,
    ]
      .filter(Boolean)
      .join(', ');
    const enriched = propertyContext
      ? `${chipText} — for ${propertyContext}`
      : chipText;
    // Day 9b (2026-05-18) — forward the Deal id alongside the user
    // input. AppPage threads it into ChatOverlay, which includes it
    // in every chat-turn request so the backend can apply the
    // per-license cost cap. Pre-T1 deals (no _id) fall through with
    // no licenseId — session + daily caps still apply.
    //
    // Task #68 (2026-06-18): when the Deal has a sourceSessionId (chat-
    // derived, the common 2.0 path), pass it as resumeSessionId so the
    // chat surface RESUMES the conversation that produced this deal
    // instead of starting fresh. Investors think of a property as a
    // conversation across time; starting fresh every visit loses the
    // earlier framing, stress tests, and accumulated context.
    const resumeSessionId = (deal as { sourceSessionId?: string }).sourceSessionId;
    navigate('/app', {
      state: {
        initialUserInput: enriched,
        initialDealId: deal._id,
        ...(resumeSessionId ? { resumeSessionId } : {}),
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      {/* License status — Day 10. Rendered ABOVE the DealScoreCard so
          the user immediately knows whether they're operating on a paid
          deal (with the $2 COGS budget consumption visible) or a
          free-tier deal. Component returns its own loading skeleton; we
          don't gate the render on dealId because pre-T1/free-tier deals
          gracefully show "Free analysis." */}
      <LicenseStatusBadge
        dealId={dealId}
        license={license}
        loading={licenseLoading}
        onChange={refetchLicense}
      />
      <DealScoreCard
        // 'strategy' is kept as the legacy enum (buy_hold | brrrr) for
        // backward compat. The dealTypeLabel override is what makes
        // the caption variant-aware ("BRRRR ANALYSIS" / "MULTI-FAMILY · 4 units").
        strategy={
          (deal.investmentStrategy === 'brrrr' ? 'brrrr' : 'buy_hold') as
            | 'buy_hold'
            | 'brrrr'
        }
        dealTypeLabel={caption}
        address={address}
        dealQuality={dealQuality}
        topFactors={topFactors}
        walkAwayPrice={walkAwayPrice}
        purchasePrice={purchasePrice}
        nextStep={nextStep}
        assumptions={assumptions}
        // Only pass projection when we have rows — the card omits
        // the section cleanly when undefined.
        projection={projection.length > 0 ? projection : undefined}
      />

      {/* ===== Adversarial critique panel (T1 — Issue #97 frontend) =====
          Renders below the DealScoreCard but above the action chips,
          because the critique is "what the engine MAY have gotten
          wrong" — context the user should read BEFORE they decide what
          to do next via a chip. Component returns null when nothing
          to show (pre-T1 deal / critique skipped), so this slot
          collapses gracefully on older deals. */}
      <CritiqueCard
        critiques={critiques}
        pending={critiquePending}
        fromPriorDecision={critiqueFromPriorDecision}
        loading={critiqueLoading}
      />

      {/* ===== Action chips ===== */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
            mb: 1,
          }}
        >
          Continue in chat
        </Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={0}
          sx={{ gap: 1 }}
          data-testid="saved-deal-hero-chips"
        >
          {variantChips.map((chip, idx) => (
            <Box
              key={`chip-${idx}`}
              role="button"
              tabIndex={0}
              onClick={() => handleChipTap(chip)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleChipTap(chip);
                }
              }}
              sx={{
                px: 1.75,
                py: 1,
                borderRadius: '999px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: 'text.primary',
                fontSize: 13,
                lineHeight: 1.3,
                cursor: 'pointer',
                userSelect: 'none',
                minHeight: 36,
                display: 'inline-flex',
                alignItems: 'center',
                transition:
                  'background-color 120ms ease, border-color 120ms ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'text.secondary',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
              data-testid={`saved-deal-hero-chip-${idx}`}
            >
              {chip}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Task #61 (2026-06-18): PDF export + email-PDF. Closes the
          pricing-page promise that the workspace was silently missing.
          Two buttons: Download (browser triggers application/pdf
          download), Email (sends PDF as attachment to the logged-in
          user's email). */}
      <ExportPdfActions dealId={dealId} />

      {/* Task #76 (2026-06-18): Standard educational/AI disclaimer at
          the foot of the workspace. The workspace is the $4.99
          destination — explicit "not advice" framing protects both
          the user and the platform. */}
      <Box sx={{ mt: 2 }}>
        <AiDisclaimer variant="standard" />
      </Box>
    </Box>
  );
}

// ===== Task #61 (2026-06-18): PDF export actions =====

interface ExportPdfActionsProps {
  dealId: string | undefined;
}

function ExportPdfActions({
  dealId,
}: ExportPdfActionsProps): React.JSX.Element | null {
  const [status, setStatus] = React.useState<
    'idle' | 'downloading' | 'emailing' | 'emailed' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!dealId) return null;

  const handleDownload = async (): Promise<void> => {
    setStatus('downloading');
    setErrorMsg(null);
    try {
      const blob = await propertyApi.exportPdf(dealId, { mode: 'download' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reanalyzr-${dealId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not download PDF');
    }
  };

  const handleEmail = async (): Promise<void> => {
    setStatus('emailing');
    setErrorMsg(null);
    try {
      await propertyApi.exportPdf(dealId, { mode: 'email' });
      setStatus('emailed');
      setTimeout(() => setStatus('idle'), 3500);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not email PDF');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleDownload}
          disabled={status === 'downloading' || status === 'emailing'}
          sx={{ minHeight: 44, textTransform: 'none', borderRadius: 2 }}
          data-testid="export-pdf-download"
        >
          {status === 'downloading' ? 'Preparing…' : '⬇️ Download PDF'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleEmail}
          disabled={status === 'downloading' || status === 'emailing' || status === 'emailed'}
          sx={{ minHeight: 44, textTransform: 'none', borderRadius: 2 }}
          data-testid="export-pdf-email"
        >
          {status === 'emailing'
            ? 'Sending…'
            : status === 'emailed'
            ? '✓ Sent to your inbox'
            : '✉️ Email PDF to me'}
        </Button>
      </Stack>
      {status === 'error' && errorMsg && (
        <Typography sx={{ fontSize: 12, color: 'error.main' }}>
          {errorMsg}
        </Typography>
      )}
    </Box>
  );
}
