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
} from '../services/api';
import { SavedDealHero } from '../components/AnalysisDetails/SavedDealHero';
import { ScenarioCompareTable } from '../components/AnalysisDetails/ScenarioCompareTable';
import { SensitivityPanel } from '../components/AnalysisDetails/SensitivityPanel';
import { ScenarioDetails } from '../components/AnalysisDetails/ScenarioDetails';
import { CritiqueCard } from '../components/AnalysisDetails/CritiqueCard';

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
  }, [id]);

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
          const sc = await propertyApi.getScenarioComparison(id!);
          const rows = sc.data?.scenarios ?? [];
          setScenarios(rows);
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
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
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
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
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
            <Typography sx={{ fontSize: 15, color: 'text.secondary', mb: 2 }}>
              Detailed multi-family analysis — unit mix, per-unit metrics,
              GRM, BEO, debt yield — lives in the full MF view.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/mf-analysis?id=${deal._id}`)}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              View detailed MF analysis →
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AnalysisDetails;