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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';
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
import {
  propertyApi,
  type CritiqueWire,
  type LicenseStatusWire,
  type ScenarioFactorScores,
} from '../../services/api';

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
  // Materialized Deals don't currently carry the chat-flow's
  // discloseAfterScoring assumptions list. Empty array for now;
  // when the materialization service starts persisting them, this
  // populates automatically. Empty list means the card hides the
  // "Standard assumptions" toggle gracefully.
  const assumptions = [] as React.ComponentProps<typeof DealScoreCard>['assumptions'];

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
    navigate('/app', {
      state: {
        initialUserInput: enriched,
        initialDealId: deal._id,
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
    </Box>
  );
}
