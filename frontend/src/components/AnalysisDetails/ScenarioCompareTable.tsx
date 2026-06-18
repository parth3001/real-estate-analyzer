/**
 * ScenarioCompareTable — factor-level scenario comparison (Task #8).
 *
 * The paid-tier depth: rows = scenarios, columns = score + the top-3
 * factors (Cash Flow 35% / IRR 25% / Market 15% = 75% of the scoring
 * weight). Expanding a row reveals the remaining 4 factors (Debt / Exit /
 * Cap / Property) AND the input deltas that produced the shift.
 *
 * Founder insight (2026-05-20): the interesting story isn't the headline
 * moving — it's the FACTOR mix flipping (e.g. leverage lifts cash-on-cash
 * but tanks debt-structure). Comparing at the factor level is the
 * institutional view a commodity calculator never shows.
 *
 * Apple-principled: default shows the 75%-weight factors; the long tail is
 * one tap deeper (progressive disclosure). Clicking a row also selects it
 * (drives the hero), keeping the spine + table in sync.
 */

import { useState } from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import { getScoreColor } from '../../utils/scoreColors';
import { WorkspaceSection } from './WorkspaceSection';
import type {
  ScenarioComparisonRowWire,
  ScenarioDeltaWire,
} from '../../services/api';

export interface ScenarioCompareTableProps {
  scenarios: ScenarioComparisonRowWire[];
  selectedId: string | null;
  onSelect: (decisionEventId: string) => void;
}

function arrow(d: ScenarioDeltaWire): string {
  return d.direction === 'up' ? '↑' : d.direction === 'down' ? '↓' : '·';
}

function rowLabel(row: ScenarioComparisonRowWire): string {
  if (row.isBaseline || row.deltas.length === 0) return 'Baseline';
  const shown = row.deltas.slice(0, 2).map((d) => `${d.label} ${arrow(d)}`);
  const extra = row.changedCount - shown.length;
  return shown.join(' · ') + (extra > 0 ? ` · +${extra}` : '');
}

/** A small numeric factor cell. */
function FactorCell({ value }: { value?: number }): React.JSX.Element {
  return (
    <Box sx={{ width: 56, flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
      <Typography
        sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
      >
        {typeof value === 'number' ? Math.round(value) : '–'}
      </Typography>
    </Box>
  );
}

export function ScenarioCompareTable({
  scenarios,
  selectedId,
  onSelect,
}: ScenarioCompareTableProps): React.JSX.Element | null {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (scenarios.length <= 1) return null;

  return (
    <WorkspaceSection label="Compare scenarios">
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <HeaderLabel>Scenario</HeaderLabel>
          </Box>
          <Box sx={{ width: 48, flexShrink: 0, textAlign: 'right' }}>
            <HeaderLabel>Score</HeaderLabel>
          </Box>
          <Box sx={{ width: 56, flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <HeaderLabel>Cash flow</HeaderLabel>
          </Box>
          <Box sx={{ width: 56, flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <HeaderLabel>IRR</HeaderLabel>
          </Box>
          <Box sx={{ width: 56, flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <HeaderLabel>Market</HeaderLabel>
          </Box>
          <Box sx={{ width: 20, flexShrink: 0 }} />
        </Box>

        {scenarios.map((row, idx) => {
          const selected = row.decisionEventId === selectedId;
          const expanded = row.decisionEventId === expandedId;
          const color = getScoreColor(row.dealQuality);
          const f = row.factorScores;
          return (
            <Box key={row.decisionEventId}>
              {/* Main row */}
              <Box
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
                  backgroundColor: selected ? 'rgba(0, 122, 255, 0.06)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: selected ? 600 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rowLabel(row)}
                    {row.isCurrent && (
                      <Typography component="span" sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600, ml: 1 }}>
                        latest
                      </Typography>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ width: 48, flexShrink: 0, textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(row.dealQuality)}
                  </Typography>
                </Box>
                <FactorCell value={f.cashFlow} />
                <FactorCell value={f.irr} />
                <FactorCell value={f.marketStrength} />
                {/* Expand toggle */}
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(expanded ? null : row.decisionEventId);
                  }}
                  sx={{
                    width: 20,
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    fontSize: 12,
                    transform: expanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                  aria-label={expanded ? 'Collapse' : 'Expand factors'}
                >
                  ▸
                </Box>
              </Box>

              {/* Expanded detail: remaining factors + input deltas */}
              <Collapse in={expanded} unmountOnExit>
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: row.deltas.length ? 1.5 : 0 }}>
                    <FactorPill label="Debt" value={f.debtStructure} />
                    <FactorPill label="Exit" value={f.exitStrategy} />
                    <FactorPill label="Cap rate" value={f.capRate} />
                    <FactorPill label="Property" value={f.propertyRisk} />
                  </Box>
                  {row.deltas.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Changed vs baseline
                      </Typography>
                      {row.deltas.map((d) => (
                        <Typography key={d.field} sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {d.label}: {d.formattedBaseline} → {d.formattedScenario}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
    </WorkspaceSection>
  );
}

function HeaderLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

function FactorPill({ label, value }: { label: string; value?: number }): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? Math.round(value) : '–'}
      </Typography>
    </Box>
  );
}
