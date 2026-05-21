/**
 * SensitivityPanel — REAL stress-testing for the selected scenario (Task #8).
 *
 * Two views, both from the scenario-sensitivity endpoint (which re-runs the
 * genuine analyzer→engine pipeline, LLM-free):
 *   1. The STACKED "realistic downside" — several small adverse moves at
 *      once (rent −3%, vacancy +3pts, rehab +15%, …). Correlated drift, not
 *      isolated stress — the failure mode single-variable testing misses
 *      ("each looks fine in isolation; they don't fail in isolation").
 *   2. Single-variable curves on the make-or-break inputs (exit, vacancy,
 *      rent, rate, rehab).
 *
 * On-demand: the recompute is ~13 engine runs, so we trigger it on a button
 * (the user opts into the stress test) rather than auto-running per select.
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { propertyApi, type SensitivityReportWire } from '../../services/api';
import { getScoreColor } from '../../utils/scoreColors';

export interface SensitivityPanelProps {
  dealId: string;
  decisionEventId: string | null;
}

export function SensitivityPanel({
  dealId,
  decisionEventId,
}: SensitivityPanelProps): React.JSX.Element | null {
  const [report, setReport] = useState<SensitivityReportWire | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Reset when the selected scenario changes — the previous report no
  // longer applies, and we don't want to show stale stress numbers.
  useEffect(() => {
    setReport(null);
    setHasRun(false);
    setLoading(false);
  }, [decisionEventId]);

  if (!decisionEventId) return null;

  const run = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await propertyApi.getScenarioSensitivity(dealId, decisionEventId);
      setReport(res.data);
      setHasRun(true);
    } catch {
      setReport(null);
      setHasRun(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
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
        Stress test
      </Typography>

      {!hasRun && (
        <Button
          variant="outlined"
          onClick={run}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {loading ? 'Running…' : 'Stress-test this scenario'}
        </Button>
      )}

      {hasRun && report?.supported === false && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {report.reason ?? 'Stress testing is available for single-family deals.'}
        </Typography>
      )}

      {hasRun && report?.supported && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {/* The stacked "realistic downside" — the headline */}
          {report.stackedDownside && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
                Realistic downside — several assumptions slip at once
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <ScoreNum value={report.baseDealQuality} />
                <Typography sx={{ color: 'text.secondary' }}>→</Typography>
                <ScoreNum value={report.stackedDownside.dealQuality} big />
              </Box>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {report.stackedDownside.perturbations.map((p) => p.label).join(' · ')}
              </Typography>
            </Box>
          )}

          {/* Single-variable curves */}
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              One input at a time
            </Typography>
            {(report.variables ?? []).map((v) => (
              <Box
                key={v.field}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, flexWrap: 'wrap' }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 500, width: 110, flexShrink: 0 }}>
                  {v.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {v.points.map((pt) => (
                    <Box
                      key={pt.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: pt.delta === 0 ? 'transparent' : 'grey.50',
                      }}
                    >
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{pt.label}</Typography>
                      <ScoreNum value={pt.dealQuality} />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function ScoreNum({ value, big }: { value?: number; big?: boolean }): React.JSX.Element {
  const v = typeof value === 'number' ? Math.round(value) : 0;
  return (
    <Typography
      sx={{
        fontSize: big ? 22 : 14,
        fontWeight: 700,
        color: getScoreColor(v),
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}
    >
      {v}
    </Typography>
  );
}
