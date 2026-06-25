import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { propertyApi } from '../services/api';
import type { ScenarioComparisonRowWire, ScenarioDetailWire } from '../services/api';
import { SavedDealHero } from '../components/AnalysisDetails/SavedDealHero';
import { ScenarioCompareTable } from '../components/AnalysisDetails/ScenarioCompareTable';
import { SensitivityPanel } from '../components/AnalysisDetails/SensitivityPanel';
import { ScenarioDetails } from '../components/AnalysisDetails/ScenarioDetails';

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
          // Default selection = the current/latest scenario (latest-wins).
          const current = rows.find((r) => r.isCurrent) ?? rows[rows.length - 1];
          setSelectedId(current?.decisionEventId ?? null);
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
              the scenario-dependent legacy tabs. Re-points on selection. */}
          <ScenarioDetails detail={selectedDetail} />
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