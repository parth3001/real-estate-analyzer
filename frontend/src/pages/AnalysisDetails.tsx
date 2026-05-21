import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress, Button, Divider } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { propertyApi } from '../services/api';
import type { ScenarioComparisonRowWire, ScenarioDetailWire } from '../services/api';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import { SavedDealHero } from '../components/AnalysisDetails/SavedDealHero';
import { ScenarioList } from '../components/AnalysisDetails/ScenarioList';
import { ScenarioCompareTable } from '../components/AnalysisDetails/ScenarioCompareTable';
import { SensitivityPanel } from '../components/AnalysisDetails/SensitivityPanel';
import { AnalysisErrorBoundary } from '../components/common/AnalysisErrorBoundary';

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

  return (
    <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/saved-properties')}
          sx={{ mb: 3 }}
        >
          Back to Saved properties
        </Button>

        {/* Task #8 — scenario workspace spine. Renders only when ≥2
            scenarios exist; selecting a row will drive the hero + details
            (hero rewire is the next component). */}
        <ScenarioList
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Phase 4 / Issue #117 — chat-style summary card on top.
            Mirrors the DealScoreCard the user saw when they analyzed
            this property in chat; gives them the continuity moment +
            quick action chips to dig deeper. The legacy SFRAnalysis
            tabs below provide the depth (Tax Intelligence, Interactive
            Analysis, Deal Optimizer, etc.) — UX Designer call was to
            preserve those tabs as the deep-dive surface, not replace
            them. Polymorphic across SFR Buy-Hold / BRRRR / House Hack
            / Multi-Family per the variant config in
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
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
            mb: 2,
          }}
        >
          Deep dive
        </Typography>
      </Box>

      {/* Deep-dive dispatch by propertyType.
          - SFR: render the legacy AnalysisResults tabs (Overview /
            Financial Details / Long-term Analysis / Tax Intelligence /
            Interactive Analysis / Deal Optimizer). They're well-crafted
            and earn their keep as the depth surface beneath the hero.
          - MF: the legacy MF deep-dive page (/mf-analysis?id=X) has
            unit-level breakdowns + multi-family-specific tabs. For now
            we link out (MF deep-dive inline-rendering is follow-up
            work — Issue #117 follow-up). The SavedDealHero above
            already shows the chat-style summary for MF deals; the
            link sends the user to the legacy depth surface. */}
      {deal.propertyType === 'MF' ? (
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
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
        </Box>
      ) : (
        // D2 fix (Day 11a, 2026-05-18): wrap legacy AnalysisResults in
        // an ErrorBoundary so a runtime error in the tabs doesn't nuke
        // the new SavedDealHero above. Resets when the dealId changes.
        //
        // D1 fix (same commit): the materialized chat-flow Deal stores
        // fields FLAT (deal.propertyType, deal.investmentStrategy, etc.),
        // NOT nested under `propertyData`. The legacy AnalysisResults
        // was built for the wizard-flow API response which DID nest.
        // Construct a propertyData shim from the flat Deal so all the
        // legacy reads (propertyType, strategy, purchasePrice, etc.)
        // find what they expect.
        //
        // The strategy field is also renamed: chat-flow uses
        // `investmentStrategy` ('buy-hold' | 'brrrr'), legacy expects
        // `strategy`. Shim maps it.
        <AnalysisErrorBoundary resetKey={deal._id}>
          <AnalysisResults
            propertyData={{
              // Spread flat fields from the Deal — propertyType,
              // monthlyRent, squareFootage, purchasePrice, downPayment,
              // closingCosts, bedrooms, bathrooms, yearBuilt, etc.
              ...deal,
              // Override strategy from the renamed investmentStrategy.
              // Map 'buy_hold' → 'buy-hold' for legacy compatibility.
              strategy:
                deal.investmentStrategy === 'brrrr'
                  ? 'brrrr'
                  : 'buy-hold',
            }}
            analysis={deal.analysis}
            dealId={deal._id}
            // Day 11h Stage 2 (2026-05-19): suppress the duplicate
            // InvestmentDecisionHero in the legacy Overview tab.
            // SavedDealHero above is the canonical score surface on this
            // route; rendering a second hero from the stale nested
            // analysis.investmentDecision caused the two-scores bug
            // (28 vs 81 on 1105 Daffodil St). Stage 1 will kill the
            // nested path on the backend; this prop is the frontend
            // half of the fix.
            hideInvestmentHero={true}
            onParameterChange={async () => {
              // Analysis is already saved, just log
              console.log('Analysis already saved');
            }}
          />
        </AnalysisErrorBoundary>
      )}
    </Box>
  );
};

export default AnalysisDetails;