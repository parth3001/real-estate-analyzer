import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { propertyApi } from '../services/api';
import type {
  ScenarioComparisonRowWire,
  ScenarioDetailWire,
  CritiqueWire,
  LicenseStatusWire,
} from '../services/api';
import { SavedDealHero } from '../components/AnalysisDetails/SavedDealHero';
import { ScenarioCompareTable } from '../components/AnalysisDetails/ScenarioCompareTable';
import { SensitivityPanel } from '../components/AnalysisDetails/SensitivityPanel';
import { ScenarioDetails } from '../components/AnalysisDetails/ScenarioDetails';
import { CritiqueCard } from '../components/AnalysisDetails/CritiqueCard';
import { LS_KEY_PENDING_DEAL_ID } from './CheckoutReturnPage';
import { useAuth } from '../contexts/AuthContext';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const AnalysisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Task #8 — scenario workspace spine. `scenarios` drives the comparison;
  // `selectedId` (default = latest/current) drives the rest of the page.
  const [scenarios, setScenarios] = useState<ScenarioComparisonRowWire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Issue #109 (2026-07-07) — strategy view state. When the workspace loads,
  // the spine defaults to the deal's own strategy (currentStrategy=null).
  // When the user clicks a sibling-strategy callout, we swap in that
  // strategy string and re-fetch the scenario spine filtered to it.
  const [strategyView, setStrategyView] = useState<string | null>(null);
  const [siblingStrategies, setSiblingStrategies] = useState<string[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
  // Full analysis for the selected scenario — drives the scenario-aware hero.
  const [selectedDetail, setSelectedDetail] = useState<ScenarioDetailWire | null>(null);

  // Adversarial critique — hoisted from SavedDealHero (2026-07-07) so the
  // critique panel can render AFTER ScenarioDetails per the "numbers
  // first, criticism second" reorder. Same fetch shape as the old
  // location; consumers see identical loading + pending semantics.
  const [critiques, setCritiques] = useState<CritiqueWire[]>([]);
  const [critiquePending, setCritiquePending] = useState(false);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueFromPriorDecision, setCritiqueFromPriorDecision] = useState(false);
  const dealIdForCritique = (deal as { _id?: string } | null)?._id;

  // Task #34 (2026-07-14) — license state lifted UP to this page so
  // both the SavedDealHero score card AND the sibling sections
  // (ScenarioCompareTable, SensitivityPanel, ScenarioDetails,
  // CritiqueCard) gate against the SAME source of truth. Prior
  // arrangement had SavedDealHero fetching independently, which meant
  // its own gating was possible but the sibling sections had no way
  // to know about the license — they always rendered, leaking the
  // paid-tier depth to unlicensed users. See PaywallCTA render below.
  const [license, setLicense] = useState<LicenseStatusWire | null | undefined>(undefined);
  const dealIdForLicense = (deal as { _id?: string } | null)?._id;
  useEffect(() => {
    if (!dealIdForLicense) return;
    let cancelled = false;
    propertyApi
      .getDealLicense(dealIdForLicense)
      .then((res) => {
        if (!cancelled) setLicense(res.data);
      })
      .catch(() => {
        // Silent failure — treat as "no license" for gating purposes.
        // A license-endpoint outage should NOT leak paid content to
        // an unlicensed user; better to overshow the paywall than
        // undershow it. Console logs in api.ts are sufficient for
        // ops debugging.
        if (!cancelled) setLicense({ status: 'none' });
      });
    return () => {
      cancelled = true;
    };
  }, [dealIdForLicense]);
  const hasActiveLicense = license?.status === 'active';
  // Model #4 (2026-07-18) — unlicensed dealIDs render the D2 unlock
  // landing (minimal address + score + Stripe redirect CTA) instead
  // of a paywalled preview workspace. licenseResolved gates the
  // switch: during the fetch we show a loading state, once resolved
  // we route to either the full workspace or the D2 landing.
  const licenseResolved = license !== undefined;

  // Task #34 — Stripe Payment Link redirect. Uses `client_reference_id`
  // to correlate the eventual checkout.session.completed webhook with
  // this deal; backend derives userId + propertyAddress from the deal
  // and issues a DealLicense scoped to canonicalAddressKey. Email is
  // pre-filled from the logged-in user so Stripe Link recognizes them.
  const { user } = useAuth();
  const paymentLinkBase = import.meta.env.VITE_STRIPE_PAYMENT_LINK as
    | string
    | undefined;
  const handleUnlock = React.useCallback((): void => {
    if (!paymentLinkBase || !dealIdForLicense) return;
    // Save the pending dealId sentinel BEFORE redirect. CheckoutReturnPage
    // reads this to know which workspace to navigate back to once the
    // webhook confirms the license. See CheckoutReturnPage header for
    // the full outbound → return flow.
    try {
      localStorage.setItem(LS_KEY_PENDING_DEAL_ID, dealIdForLicense);
    } catch {
      // Best-effort: private-window / storage-full users still get a
      // working paywall — CheckoutReturnPage's 'no-sentinel' state
      // routes them to Saved Properties instead of a specific deal.
    }
    const params = new URLSearchParams();
    params.set('client_reference_id', dealIdForLicense);
    if (user?.email) params.set('prefilled_email', user.email);
    window.location.href = `${paymentLinkBase}?${params.toString()}`;
  }, [paymentLinkBase, dealIdForLicense, user?.email]);
  const unlockHandler = paymentLinkBase && dealIdForLicense ? handleUnlock : undefined;
  useEffect(() => {
    if (!dealIdForCritique) return;
    let cancelled = false;
    setCritiqueLoading(true);
    propertyApi
      .getDealCritique(dealIdForCritique)
      .then((res) => {
        if (cancelled) return;
        setCritiques(res.data.critiques);
        setCritiquePending(res.data.pending);
        setCritiqueFromPriorDecision(res.data.fromPriorDecision === true);
      })
      .catch(() => {
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
  }, [dealIdForCritique]);

  useEffect(() => {
    if (!id) {
      setError('No analysis ID provided');
      setLoading(false);
      return;
    }

    loadDeal();
    // Re-run when strategyView flips (user clicked a sibling-strategy
    // callout) so the spine + selected scenario re-hydrate under the
    // new strategy filter. eslint-disable is intentional — we want
    // strategyView as a dep but loadDeal isn't stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, strategyView]);

  // Task #8: when the selected scenario changes, lazy-load its full analysis
  // for the scenario-aware hero (and, later, the Details sections). Default
  // selection is the latest scenario, so this also loads the default view.
  useEffect(() => {
    if (!id || !selectedId) {
      setSelectedDetail(null);
      return;
    }
    let cancelled = false;
    propertyApi
      .getScenarioDetail(id, selectedId)
      .then((res) => {
        if (!cancelled) setSelectedDetail(res.data);
      })
      .catch(() => {
        if (!cancelled) setSelectedDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, selectedId]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertyApi.getProperty(id!);
      if (response.status === 200 && response.data) {
        setDeal(response.data);
        // Task #8: load the scenario comparison (the spine). Non-fatal —
        // a single-scenario deal or pre-stamp events just yield a short or
        // empty list, and ScenarioList renders nothing for ≤1 scenario.
        try {
          const sc = await propertyApi.getScenarioComparison(id!, strategyView ?? undefined);
          const rows = sc.data?.scenarios ?? [];
          setScenarios(rows);
          setSiblingStrategies(sc.data?.siblingStrategies ?? []);
          setActiveStrategy(sc.data?.currentStrategy ?? null);
          // Issue #95 / #225 fix (2026-07-07) — DEFAULT TO BASELINE, not
          // to the latest saved scenario. Prior behavior ("latest-wins")
          // silently switched the user's view to their most recently saved
          // stress-test scenario, so a returning user opened their saved
          // deal and saw stressed numbers where they expected baseline —
          // a trust break on a paid product. Baseline is the deal as
          // originally analyzed and is the ONLY view that answers
          // "what is this deal?" User-created scenarios are explored via
          // explicit clicks in the Compare scenarios table.
          //
          // Fallback chain if isBaseline flag is missing on any row
          // (older deals pre-flag): first row in the list (spine order
          // is oldest → newest, so first = baseline).
          const baseline = rows.find((r) => r.isBaseline) ?? rows[0];
          setSelectedId(baseline?.decisionEventId ?? null);
        } catch (scenarioErr) {
          console.warn('Scenario comparison unavailable:', scenarioErr);
          setScenarios([]);
        }
      } else {
        throw new Error('Failed to load analysis');
      }
    } catch (error: any) {
      console.error('Error loading deal:', error);
      setError(error.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/saved-properties')}
          sx={{ mb: 3 }}
        >
          Back to Saved Properties
        </Button>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Failed to Load Analysis</Typography>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDeal}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/saved-properties')}
          sx={{ mb: 3 }}
        >
          Back to Saved Properties
        </Button>
        <Alert severity="warning">
          Analysis not found
        </Alert>
      </Box>
    );
  }

  // Issue #196 (2026-06-24) — brand the page as "Deal Workspace" so the
  // term we've been using internally becomes a real product name visible
  // to users. The address + Deal Workspace combo shows up in the browser
  // tab, the eyebrow tag on the page, and (later) shareable surfaces.
  const propertyAddress =
    (deal as { propertyAddress?: { street?: string; city?: string; state?: string } } | null)
      ?.propertyAddress;
  const addressLine = propertyAddress
    ? [propertyAddress.street, propertyAddress.city, propertyAddress.state]
        .filter(Boolean)
        .join(', ')
    : 'Saved deal';

  return (
    <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Helmet>
        <title>{`Deal Workspace · ${addressLine}`}</title>
      </Helmet>
      {/* Centered reading column (Task #19 polish): financial data reads
          calmer in a constrained measure than stretched edge-to-edge on wide
          screens. One column holds the whole workspace — hero, compare,
          stress, details — so it scans as a single surface. */}
      <Box sx={{ p: 3, maxWidth: 880, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/saved-properties')}
          sx={{ mb: 2 }}
        >
          Back to Saved properties
        </Button>

        {/* Issue #196 — "DEAL WORKSPACE" eyebrow brand. Small uppercase
            tag in the Apple style sits above the hero so the page reads
            as a *place* (a workspace), not a generic detail view. */}
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            color: 'text.secondary',
            letterSpacing: '0.12em',
            fontSize: 11,
            fontWeight: 700,
            mb: 1.5,
          }}
          data-testid="deal-workspace-eyebrow"
        >
          Deal Workspace
        </Typography>

        {/* Task #17 (2026-05-21): the standalone ScenarioList spine was
            removed — it duplicated the ScenarioCompareTable below (two
            tables of the same scenarios). The compare table is the single
            scenario surface now: selectable (drives the hero) AND shows the
            factor columns. ScenarioList component kept for potential reuse
            (e.g., a future compact mobile selector). */}

        {/* Phase 4 / Issue #117 — chat-style summary card on top.
            Mirrors the DealScoreCard the user saw when they analyzed
            this property in chat; gives them the continuity moment +
            quick action chips to dig deeper. The depth now lives in the
            scenario workspace below (Compare / Stress test / Details),
            all fed from the substrate — the legacy SFRAnalysis deep-dive
            tabs were removed (Task #19). Polymorphic across SFR Buy-Hold /
            BRRRR / House Hack / Multi-Family per the variant config in
            ../components/AnalysisDetails/savedDealVariants.ts. */}
        {/* Issue #109 (2026-07-07, #108 follow-up) — Sibling-strategy callout.
            When the user has analyzed the same property under a different
            strategy (e.g., started with BRRRR, then re-analyzed as buy-hold),
            #108 isolates each into its own spine — clean, but hides the
            other strategy from view. This callout restores discoverability:
            shows which other strategies exist at this address and lets the
            user swap between them with one click. Renders above the score
            hero because "am I looking at the right strategy?" is a load-
            bearing question that has to be answered before the numbers
            below are trustworthy. */}
        {siblingStrategies.length > 0 && (() => {
          const prettify = (s: string): string =>
            ({
              buy_hold: 'Buy & Hold',
              brrrr: 'BRRRR',
              house_hack: 'House Hack',
            } as const)[s as 'buy_hold' | 'brrrr' | 'house_hack'] ?? s.replace(/_/g, ' ');
          const currentLabel = activeStrategy ? prettify(activeStrategy) : 'this strategy';
          return (
            <Box
              sx={{
                mb: 2,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(0, 122, 255, 0.06)',
                border: '1px solid',
                borderColor: 'rgba(0, 122, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}
              data-testid="sibling-strategy-callout"
            >
              <Box>
                <Typography sx={{ fontSize: 14, color: 'text.primary', fontWeight: 600 }}>
                  Viewing: {currentLabel}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  You&apos;ve also analyzed this property as{' '}
                  {siblingStrategies.map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && (i === siblingStrategies.length - 1 ? ' and ' : ', ')}
                      <strong>{prettify(s)}</strong>
                    </React.Fragment>
                  ))}
                  .
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {siblingStrategies.map((s) => (
                  <Button
                    key={s}
                    size="small"
                    variant="outlined"
                    onClick={() => setStrategyView(s)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                      borderColor: 'rgba(0, 122, 255, 0.5)',
                      color: 'primary.main',
                    }}
                  >
                    View as {prettify(s)} →
                  </Button>
                ))}
              </Box>
            </Box>
          );
        })()}

        {/* Issue #95 / #225 fix (2026-07-07) — "Viewing scenario" badge.
            When the user is looking at a non-baseline scenario, we make
            that state IMPOSSIBLE TO MISS. Users seeing stressed numbers
            without knowing they're in a scenario is exactly the trust
            break the "default to baseline" fix protects against; this
            badge is the second layer of that protection — it also lets
            the user return to baseline with one click. */}
        {(() => {
          const baseline = scenarios.find((r) => r.isBaseline) ?? scenarios[0];
          const selected = scenarios.find((r) => r.decisionEventId === selectedId);
          const viewingScenario =
            selected && baseline && selected.decisionEventId !== baseline.decisionEventId;
          if (!viewingScenario) return null;
          const scenarioName = selected!.isBaseline
            ? 'Baseline'
            : (selected!.deltas.slice(0, 2).map((d) => `${d.label} ${d.direction === 'up' ? '↑' : d.direction === 'down' ? '↓' : '·'}`).join(' · ') || 'Scenario');
          return (
            <Box
              sx={{
                mb: 2,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255, 149, 0, 0.08)',
                border: '1px solid',
                borderColor: 'rgba(255, 149, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}
              role="status"
              aria-live="polite"
              data-testid="viewing-scenario-badge"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#B25000' }}>
                  You&apos;re viewing a scenario, not the baseline
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  · {scenarioName}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setSelectedId(baseline!.decisionEventId)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#B25000',
                  fontSize: 13,
                  '&:hover': { bgcolor: 'rgba(255, 149, 0, 0.14)' },
                }}
              >
                ← Back to Baseline
              </Button>
            </Box>
          );
        })()}

        {/* Model #4 (2026-07-18) — D2 unlock landing.
            Rendered INSTEAD of the workspace when the license is
            confirmed inactive. Shows address + score + Unlock CTA.
            Minimal by design — just enough to remind the user what
            this deal is, then let them decide to pay or leave. */}
        {licenseResolved && !hasActiveLicense && (
          <Box
            sx={{
              mt: 4,
              mb: 3,
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              textAlign: 'center',
            }}
            data-testid="deal-unlock-landing"
          >
            <LockOutlinedIcon
              sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }}
            />
            <Typography
              component="h2"
              sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, mb: 1 }}
            >
              Unlock this deal
            </Typography>
            <Typography sx={{ fontSize: 15, color: 'text.secondary', mb: 3 }}>
              {deal.propertyAddress?.street}
              {deal.propertyAddress?.city && `, ${deal.propertyAddress.city}`}
              {deal.propertyAddress?.state && `, ${deal.propertyAddress.state}`}
            </Typography>
            <Typography
              sx={{ fontSize: 14, color: 'text.secondary', mb: 3, lineHeight: 1.5 }}
            >
              Get the full workspace — walk-away price, 10-year projection,
              stress tests, unlimited chat, scenario comparison, adversarial
              critique, and PDF export. One-time $4.99, 180-day editing window.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={unlockHandler}
              disabled={!unlockHandler}
              sx={{
                minHeight: 48,
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                fontSize: 16,
                px: 3,
              }}
              data-testid="deal-unlock-button"
            >
              Unlock · $4.99
            </Button>
            {!unlockHandler && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1.5 }}>
                Payment integration launching soon
              </Typography>
            )}
          </Box>
        )}

        {/* Licensed workspace — the full deal-working surface.
            Only renders when license is resolved AND active. Under
            Model #4 there is no "unlicensed workspace" surface; the
            D2 landing above handles that case. */}
        {hasActiveLicense && (
        <>
        <SavedDealHero
          deal={deal}
          selectedScenario={
            selectedDetail
              ? {
                  dealQuality: selectedDetail.dealQuality,
                  factorScores: selectedDetail.factorScores,
                  walkAwayPrice: selectedDetail.walkAwayPrice,
                  purchasePrice: selectedDetail.propertyData?.purchasePrice,
                  assumptions: selectedDetail.assumptions,
                }
              : undefined
          }
        />

        {/* Task #8 — factor-level scenario comparison (paid-tier depth).
            Renders only for ≥2 scenarios; selecting a row drives the hero. */}
        <Box sx={{ mt: 3 }}>
          <ScenarioCompareTable
            scenarios={scenarios}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {/* Task #8 — on-demand stress test for the selected scenario. */}
          {id && scenarios.length > 0 && (
            <SensitivityPanel dealId={id} decisionEventId={selectedId} />
          )}
          {/* Task #8 — per-scenario depth (financials + long-term), replacing
              the scenario-dependent legacy tabs. Re-points on selection.
              Issue #95 / #225 follow-up (2026-07-07): pass the current
              scenario name so the Details header reads "Details · Baseline"
              or "Details · Monthly rent ↑" — user always knows WHICH
              scenario the numbers below belong to. */}
          <ScenarioDetails
            detail={selectedDetail}
            scenarioName={(() => {
              const sel = scenarios.find((r) => r.decisionEventId === selectedId);
              if (!sel) return undefined;
              if (sel.isBaseline) return 'Baseline';
              const parts = sel.deltas.slice(0, 2).map((d) => `${d.label} ${d.direction === 'up' ? '↑' : d.direction === 'down' ? '↓' : '·'}`);
              return parts.join(' · ') || 'Scenario';
            })()}
          />

          {/* Adversarial critique — MOVED (2026-07-07) from inside
              SavedDealHero to AFTER ScenarioDetails. User feedback:
              numbers should come before commentary. Institutional
              convention: metrics first, then the critique that
              contests them. Sits at the bottom of the workspace as
              the "second opinion" the user reads AFTER they've
              absorbed the deal. Component returns null when nothing
              to show (pre-T1 deal / critique skipped). */}
          <Box sx={{ mt: 3 }}>
            <CritiqueCard
              critiques={critiques}
              pending={critiquePending}
              fromPriorDecision={critiqueFromPriorDecision}
              loading={critiqueLoading}
            />
          </Box>
        </Box>

        {/* Task #19 (2026-05-21): the legacy SFR 11-tab deep-dive (AnalysisResults)
            was REMOVED. Its substrate-backed depth — Financial Details, Long-term,
            the year-by-year projection, Market, and Comparables — now lives in the
            scenario-scoped workspace above (ScenarioDetails), read from the SAME
            engine output, in the shape it's actually stored in. The legacy tabs
            read a wizard-flow shape the substrate doesn't populate, so they showed
            $0 / "No Projection Data Available" — a trust-killer we removed rather
            than patched (Architect + UX Designer aligned). Tax Intelligence and
            Deal Optimizer were NOT substrate-backed (dropped at projection time),
            so they're deferred to a future recompute path, not migrated.

            MF deals keep the link-out to the legacy MF deep-dive: the workspace
            Details is currently SFR-shaped and the MF Details variant is WIP
            (Task #21). Until it lands, MF users get the working legacy MF page
            rather than a half-empty workspace — never a broken one. */}
        {deal.propertyType === 'MF' && (
          <Box
            sx={{
              mt: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            {/* Task #120 (2026-07-26): MF is WIP (Task #21). The legacy
                /mf-analysis wizard is unlinked from the v2.0 IA. For now
                surface a "chat about this property" CTA instead of the
                dead-end wizard link. Full MF workspace lands with the
                MF stress-test pipeline (Task #30). */}
            <Typography sx={{ fontSize: 15, color: 'text.secondary', mb: 2 }}>
              Detailed multi-family analysis — unit mix, per-unit metrics,
              GRM, BEO, debt yield — is in progress. In the meantime, chat
              with the AI about this property to explore any specific metric.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.removeItem('reanalyzr.chat.sessionId');
                }
                navigate('/app');
              }}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Chat about this property →
            </Button>
          </Box>
        )}
        </>
        )}
      </Box>
    </Box>
  );
};

export default AnalysisDetails;