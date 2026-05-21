/**
 * ScenarioList — the spine of the scenario-scoped workspace (Task #8).
 *
 * Renders every substrate-derived what-if for a property as diff-labeled
 * rows. Selecting a row drives the rest of the page (hero, details).
 *
 * Design (UX spec, Apple-principled, 2026-05-20):
 *   - Each row = its DIFF vs baseline (field-agnostic — whatever changed),
 *     capped at 2 deltas + "+N more". NO hover dependency (touch-first).
 *   - Baseline row reads "Baseline assumptions"; current/latest gets a tag.
 *   - dealQuality + score-color dot on the right.
 *   - Renders only when there are ≥2 scenarios (nothing to compare with one).
 */

import { Box, Typography } from '@mui/material';
import { getScoreColor } from '../../utils/scoreColors';
import type {
  ScenarioComparisonRowWire,
  ScenarioDeltaWire,
} from '../../services/api';

export interface ScenarioListProps {
  scenarios: ScenarioComparisonRowWire[];
  selectedId: string | null;
  onSelect: (decisionEventId: string) => void;
}

function arrow(d: ScenarioDeltaWire): string {
  return d.direction === 'up' ? '↑' : d.direction === 'down' ? '↓' : '·';
}

/** Compact, field-agnostic label: the deltas that define this scenario. */
function diffSummary(row: ScenarioComparisonRowWire): string {
  if (row.isBaseline || row.deltas.length === 0) return 'Baseline assumptions';
  const shown = row.deltas.slice(0, 2).map((d) => `${d.label} ${arrow(d)}`);
  const extra = row.changedCount - shown.length;
  return shown.join(' · ') + (extra > 0 ? ` · +${extra} more` : '');
}

export function ScenarioList({
  scenarios,
  selectedId,
  onSelect,
}: ScenarioListProps): React.JSX.Element | null {
  // One scenario = nothing to compare. The hero alone tells the story.
  if (scenarios.length <= 1) return null;

  return (
    <Box sx={{ mb: 3 }}>
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
        Scenarios · you analyzed this {scenarios.length} ways
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {scenarios.map((row, idx) => {
          const selected = row.decisionEventId === selectedId;
          const color = getScoreColor(row.dealQuality);
          return (
            <Box
              key={row.decisionEventId}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(row.decisionEventId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(row.decisionEventId);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderTop: idx === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
                backgroundColor: selected
                  ? 'rgba(0, 122, 255, 0.06)'
                  : 'transparent',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  backgroundColor: selected
                    ? 'rgba(0, 122, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              {/* Selection indicator */}
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: '2px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  backgroundColor: selected ? 'primary.main' : 'transparent',
                }}
              />

              {/* Diff label + tags */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: selected ? 600 : 500,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {diffSummary(row)}
                </Typography>
                {row.isCurrent && (
                  <Typography
                    sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600 }}
                  >
                    latest
                  </Typography>
                )}
              </Box>

              {/* Score + color dot */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(row.dealQuality)}
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
